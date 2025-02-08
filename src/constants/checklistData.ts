// Base Types
export type Headquarters = '경기본부' | '충남본부';
export type Branch = '여주이천지사' | '양평광주서울지사' | '천안지사' | '공주지사';
export type InspectorPosition = '본사' | '본부' | '지사' | '현장대리인';
export type InspectorAffiliation = '본사' | '본부' | '지사' | '시공사' | '기타';
export type ConstructionStatus = '착공전' | '공사중' | '공사중지';
export type ConstructionCost = 
  | '1억 미만'
  | '1억 이상 ~ 5억 미만'
  | '5억 이상 ~ 20억 미만'
  | '20억 이상 ~ 50억 미만'
  | '50억 이상 ~ 120억 미만'
  | '120억 이상 ~ 150억 미만(건축)'
  | '150억 이상(토목)';
export type YesNo = '예' | '아니오';
export type CheckOption = '이행' | '불이행' | '해당없음';

// Constant Arrays with Type Safety
export const HEADQUARTERS: readonly Headquarters[] = ['경기본부', '충남본부'];
export const INSPECTOR_AFFILIATIONS: readonly InspectorAffiliation[] = ['본사', '본부', '지사', '시공사', '기타'];

export const BRANCH_OFFICES: Readonly<Record<Headquarters, readonly Branch[]>> = {
  '경기본부': ['여주이천지사', '양평광주서울지사'],
  '충남본부': ['천안지사', '공주지사']
} as const;

export const INSPECTOR_POSITIONS: readonly InspectorPosition[] = ['본사', '본부', '지사', '현장대리인'];

export const CONSTRUCTION_STATUS: readonly ConstructionStatus[] = ['착공전', '공사중', '공사중지'];

export const CONSTRUCTION_COST: readonly ConstructionCost[] = [
  '1억 미만',
  '1억 이상 ~ 5억 미만',
  '5억 이상 ~ 20억 미만',
  '20억 이상 ~ 50억 미만',
  '50억 이상 ~ 120억 미만',
  '120억 이상 ~ 150억 미만(건축)',
  '150억 이상(토목)'
];

export const CONSTRUCTION_TYPES_1 = [
  '31m이상 건축물',
  '연면적 3만제곱미터 이상 건축물',
  '연면적 5천제곱미터 이상 창고외시설',
  '교량(최대지간50m 이상)',
  '터널공사',
  '저수용량 2천만톤이상댐',
  '10m이상 굴착공사'
] as const;

export const CONSTRUCTION_TYPES_2 = [
  '1,2종 시설물 건설공사',
  '지하 10m 이상 굴착 공사',
  '폭발물 사용',
  '10층 이상,16층 미만 건축물 공사',
  '10층 이상 건축물 리모델링 공사',
  '수직증축형 리모델링',
  '천공기, 항타항발기, 타워크레인 사용 공사',
  '가설구조물(31m이상 비계, 5m이상 거푸집, 동바리, 갱폼, 2m 이상 흙막이, 10m이상 외부작업용 가설구조물) 사용공사'
] as const;

export const YES_NO_OPTIONS: readonly YesNo[] = ['예', '아니오'];

export const CHECK_OPTIONS: readonly CheckOption[] = ['이행', '불이행', '해당없음'];

// Complex Types
export interface DependsOnObject {
  readonly type: 'hasSpecialConstruction2';
  readonly condition: YesNo;
}

export type DependsOnType = DependsOnObject | 'hasSpecialConstruction1' | 'hasSpecialConstruction2';

export interface ChecklistItem {
  readonly states: readonly ConstructionStatus[];
  readonly costs: 'all' | readonly ConstructionCost[];
  readonly dependsOn?: DependsOnType;
}

// Type Guards
export const isDependsOnObject = (value: DependsOnType): value is DependsOnObject =>
  typeof value === 'object' && value !== null && 'type' in value && value.type === 'hasSpecialConstruction2';

// Checklist Items with Strict Typing
export const CHECKLIST_ITEMS: Readonly<Record<string, ChecklistItem>> = {
  '시공안전계획서 수립 여부': {
    states: CONSTRUCTION_STATUS,
    costs: 'all',
    dependsOn: {
      type: 'hasSpecialConstruction2',
      condition: '아니오'
    }
  },
  '공사안전보건대장 작성여부': {
    states: CONSTRUCTION_STATUS,
    costs: ['50억 이상 ~ 120억 미만', '120억 이상 ~ 150억 미만(건축)', '150억 이상(토목)'] as const
  },
  '안전관리계획서작성여부': {
    states: CONSTRUCTION_STATUS,
    costs: 'all',
    dependsOn: 'hasSpecialConstruction2'
  },
  '가설구조물 구조적 안전성 검토': {
    states: ['착공전', '공사중'] as const,
    costs: 'all',
    dependsOn: 'hasSpecialConstruction2'
  },
  '일일안전점검여부': {
    states: ['공사중'] as const,
    costs: 'all'
  },
  '위험성평가실시여부': {
    states: ['공사중'] as const,
    costs: 'all'
  },
  '작업계획서작성 여부': {
    states: ['공사중'] as const,
    costs: 'all'
  },
  '위험공종 작업허가제 작성 여부': {
    states: ['공사중'] as const,
    costs: 'all'
  },
  'TBM실시여부': {
    states: ['공사중'] as const,
    costs: 'all'
  },
  '근로자 작업장 출입 전,후 체크': {
    states: ['공사중'] as const,
    costs: 'all'
  },
  '안전보건조정자 선임 및 회의 여부': {
    states: ['공사중'] as const,
    costs: ['50억 이상 ~ 120억 미만', '120억 이상 ~ 150억 미만(건축)', '150억 이상(토목)'] as const
  },
  '안전보건협의체 실시 여부': {
    states: ['공사중'] as const,
    costs: ['50억 이상 ~ 120억 미만', '120억 이상 ~ 150억 미만(건축)', '150억 이상(토목)'] as const
  },
  '재해예방기술지도 실시 여부': {
    states: ['공사중'] as const,
    costs: ['1억 이상 ~ 5억 미만', '5억 이상 ~ 20억 미만', '20억 이상 ~ 50억 미만', '50억 이상 ~ 120억 미만'] as const
  },
  '유해위험방지계획서 수립여부': {
    states: CONSTRUCTION_STATUS,
    costs: 'all',
    dependsOn: 'hasSpecialConstruction1'
  },
  '산업안전보건관리비 사용내역 기록 여부': {
    states: ['공사중', '공사중지'] as const,
    costs: 'all'
  },
  '건진법 안전관리비 사용내역 기록 여부': {
    states: ['공사중', '공사중지'] as const,
    costs: 'all'
  },
  '휴게시설 구축 여부': {
    states: ['공사중'] as const,
    costs: ['20억 이상 ~ 50억 미만', '50억 이상 ~ 120억 미만', '120억 이상 ~ 150억 미만(건축)', '150억 이상(토목)'] as const
  },
  '안전보건총괄책임자/관리책임자 선임여부': {
    states: CONSTRUCTION_STATUS,
    costs: ['20억 이상 ~ 50억 미만', '50억 이상 ~ 120억 미만', '120억 이상 ~ 150억 미만(건축)', '150억 이상(토목)'] as const
  },
  '안전보건교육': {
    states: ['공사중', '공사중지'] as const,
    costs: 'all'
  },
  'MSDS(물질안전보건자료) 게시 및 교육 여부': {
    states: ['공사중', '공사중지'] as const,
    costs: 'all'
  }
} as const; 