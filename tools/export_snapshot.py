"""
Mil-Kit 데이터 스냅샷 생성기
  Postgres(public.jobkorea_job_posting, public.listnationalqualifcation) → data.js

  접속 정보는 코드에 넣지 않고 환경변수로만 받습니다.
    PGHOST, PGPORT, PGUSER, PGPASSWORD, (PGDATABASE=postgres)
  사용:  python export_snapshot.py  [출력경로=data.js]

  GitHub Pages 같은 정적 호스팅은 DB에 직접 붙을 수 없고, 붙더라도 비밀번호가
  공개됩니다. 그래서 필요한 컬럼만 골라 정적 스냅샷(data.js)으로 내보냅니다.
"""
import os, sys, re, json, datetime
import psycopg2

OUT = sys.argv[1] if len(sys.argv) > 1 else 'data.js'

# 직무(rpcd) → 관련 국가자격 (앱의 JK_JOBS와 같은 편집 매핑)
JOB_CERTS = {
  '1000229': ['정보처리기사', '정보처리산업기사'], '1000234': ['정보통신산업기사', '정보처리기능사', '통신선로기능사'],
  '1000238': ['정보보안산업기사', '정보보안기사', '정보처리기사'], '1000233': ['정보처리산업기사', '정보처리기능사'],
  '1000326': ['전기산업기사', '전기기능사', '전자기기기능사'], '1000329': ['설비보전기능사', '전기기능사', '공조냉동기계기능사'],
  '1000334': ['무선설비기능사', '정보통신산업기사'], '1000336': ['측량기능사', '측량및지형공간정보산업기사'],
  '1000338': ['위험물기능사', '지게차운전기능사'], '1000340': ['품질경영산업기사', '산업안전산업기사'],
  '1000343': ['용접기능사', '특수용접기능사'], '1000310': ['자동차정비기능사', '자동차정비산업기사', '건설기계정비기능사'],
  '1000317': ['경비지도사'], '1000309': ['공조냉동기계기능사', '전기기능사'], '1000265': ['물류관리사', '지게차운전기능사'],
  '1000267': ['물류관리사'], '1000273': ['굴착기운전기능사', '기중기운전기능사', '지게차운전기능사'],
  '1000359': ['전기기능사', '공조냉동기계기능사', '에너지관리기능사'], '1000361': ['산업안전기사', '산업안전산업기사', '건설안전기사'],
  '1000363': ['소방설비산업기사(전기분야)', '소방설비기사(기계분야)', '위험물기능사'],
  '1000298': ['한식조리기능사', '양식조리기능사', '조리산업기사(한식)'], '1000201': ['직업상담사2급', '공인노무사'],
  '1000283': ['정보처리기능사', '전기기능사'], '1000413': ['위험물기능사', '산업안전산업기사'],
}
GRADE_SUFFIX = r'(기능사|산업기사|기사|기술사|기능장)$'
GRADE_ORDER = {'05': 0, '04': 1, '03': 2, '02': 3, '01': 4}

def norm_series(q):
    """원본 Q-Net seriescd(01 기술사·02 기능장·03 기사/산업기사·04 기능사)를 앱 등급 코드로 정리"""
    name, sc = q['jmfldnm'], q['seriescd']
    if q['qualgbcd'] != 'T':
        return sc, q['seriesnm']
    if sc == '04': return '05', '기능사'
    if sc == '03': return ('04', '산업기사') if '산업기사' in name else ('03', '기사')
    return sc, q['seriesnm']          # 01 기술사, 02 기능장

def main():
    c = psycopg2.connect(host=os.environ['PGHOST'], port=os.environ['PGPORT'], user=os.environ['PGUSER'],
                         password=os.environ['PGPASSWORD'], dbname=os.environ.get('PGDATABASE', 'postgres'),
                         connect_timeout=20, client_encoding='UTF8')
    cur = c.cursor()
    cur.execute('select jmcd,jmfldnm,qualgbcd,qualgbnm,seriescd,seriesnm,obligfldcd,obligfldnm,mdobligfldcd,mdobligfldnm '
                'from public.listnationalqualifcation order by jmfldnm')
    cols = [d[0] for d in cur.description]
    Q = [dict(zip(cols, r)) for r in cur.fetchall()]
    cur.execute('select gi_no,gi_subject,c_name,jk_url,area_code,gi_part_no,gi_keyword,gi_career,gi_career_year_cnt,'
                'gi_edu_cutline,gi_job_type,gi_pay,gi_pay_term,gi_pay_flag,gi_end_date,gi_w_date,gi_e_date,gi_e_time,'
                'career_label,job_type_label,edu_label,pay_label from public.jobkorea_job_posting')
    cols = [d[0] for d in cur.description]
    J = [dict(zip(cols, r)) for r in cur.fetchall()]

    qn, by_name, core = [], {}, {}
    for q in Q:
        sc, sn = norm_series(q)
        row = [q['jmcd'], q['jmfldnm'], q['qualgbcd'], q['qualgbnm'], sc, sn, q['obligfldcd'] or '', q['obligfldnm'] or '',
               q['mdobligfldcd'] or '', q['mdobligfldnm'] or '', q['seriescd']]
        qn.append(row); by_name[q['jmfldnm']] = row
        if q['qualgbcd'] == 'T':
            k = re.sub(GRADE_SUFFIX, '', re.sub(r'\(.*?\)', '', q['jmfldnm']))
            if len(k) >= 2: core.setdefault(k, []).append(row)

    def link(r):
        subj, tags = r['gi_subject'] or '', [t.strip() for t in (r['gi_keyword'] or '').split(',') if t.strip()]
        text = subj + ' ' + ' '.join(tags)
        got = []
        for name, row in by_name.items():                       # ① 자격 이름이 그대로 나오면 확정
            if len(name) >= 4 and name in text: got.append(row)
        for k, rows in core.items():                            # ② 분야 핵심어 (짧은 말은 태그·등급어와 함께일 때만)
            strong = len(k) >= 3 and k in text
            weak = len(k) == 2 and (any(t.startswith(k) for t in tags) or re.search(k + r'\s?(기능사|산업기사|기사|자격)', subj))
            if strong or weak:   # 기술사·기능장은 실무 경력이 필요해 자동 연결에서 뺀다
                got += sorted([x for x in rows if x[4] in ('05', '04', '03')], key=lambda x: GRADE_ORDER.get(x[4], 9))[:3]
        for p in (r['gi_part_no'] or '').split(','):            # ③ 직무 코드 기반 관련 자격
            got += [by_name[n] for n in JOB_CERTS.get(p, []) if n in by_name]
        seen, out = set(), []
        for row in got:
            if row[0] not in seen: seen.add(row[0]); out.append(row[0])
        return out[:4]

    def d(v): return v.isoformat() if isinstance(v, (datetime.date, datetime.datetime)) else (v or '')
    jk = [[r['gi_no'], r['gi_subject'] or '', r['c_name'] or '', r['jk_url'] or '', r['area_code'] or '', r['gi_part_no'] or '',
           r['gi_keyword'] or '', r['gi_career'], r['gi_career_year_cnt'], r['gi_edu_cutline'], r['gi_job_type'] or '',
           r['gi_pay'], r['gi_pay_term'] or '0,0', r['gi_pay_flag'], d(r['gi_end_date']), d(r['gi_w_date']), d(r['gi_e_date']),
           r['gi_e_time'] or 0, r['career_label'] or '', r['job_type_label'] or '', r['edu_label'] or '', r['pay_label'] or '',
           link(r)] for r in J]

    snap = {'at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M'), 'qn': qn, 'jk': jk}
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('/* Mil-Kit 데이터 스냅샷 · export_snapshot.py 로 생성 · 잡코리아 채용정보 + Q-Net 국가자격 종목 */\n')
        f.write('window.MK_DATA=' + json.dumps(snap, ensure_ascii=False, separators=(',', ':')) + ';\n')
    linked = sum(1 for r in jk if r[-1])
    sys.stdout.reconfigure(encoding='utf-8')
    print(f'certs {len(qn)} · postings {len(jk)} · postings with linked certs {linked} → {OUT} ({os.path.getsize(OUT)//1024} KB)')

if __name__ == '__main__':
    main()
