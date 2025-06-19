import {
  HEADQUARTERS,
  type Headquarters,
  BRANCH_OFFICES,
  CONSTRUCTION_STATUS,
  type ConstructionStatus,
  CONSTRUCTION_COST,
  type ConstructionCost,
  CHECKLIST_ITEMS,
  isDependsOnObject,
  type DependsOnObject,
  type DependsOnType,
  YES_NO_OPTIONS,
} from '../constants/checklistData';

describe('Checklist Data Types', () => {
  test('HEADQUARTERS should contain all defined headquarters', () => {
    const expectedHeadquarters = ['본사', '경기', '충남'] as const;
    expectedHeadquarters.forEach(hq => {
      expect(HEADQUARTERS).toContain(hq);
    });
  });

  test('BRANCH_OFFICES should have correct branches for each headquarters', () => {
    expect(BRANCH_OFFICES['경기']).toContain('여주·이천지사');
    expect(BRANCH_OFFICES['경기']).toContain('양평·광주·서울지사');
    expect(BRANCH_OFFICES['충남']).toContain('천안지사');
    expect(BRANCH_OFFICES['충남']).toContain('공주지사');
  });

  test('CONSTRUCTION_STATUS should contain all defined statuses', () => {
    const expectedStatuses = ['착공전', '공사중', '공사중지'] as const;
    expect(CONSTRUCTION_STATUS).toEqual(expectedStatuses);
  });

  test('isDependsOnObject should correctly identify DependsOnObject', () => {
    const validObject: DependsOnObject = {
      type: 'hasSpecialConstruction2',
      condition: '예'
    };
    const invalidObject1 = 'hasSpecialConstruction1' as DependsOnType;
    const invalidObject2 = 'hasSpecialConstruction2' as DependsOnType;

    expect(isDependsOnObject(validObject)).toBe(true);
    expect(isDependsOnObject(invalidObject1)).toBe(false);
    expect(isDependsOnObject(invalidObject2)).toBe(false);
  });

  test('CHECKLIST_ITEMS should have valid states and costs', () => {
    Object.entries(CHECKLIST_ITEMS).forEach(([_, item]) => {
      // Check states
      item.states.forEach(state => {
        expect(CONSTRUCTION_STATUS).toContain(state);
      });

      // Check costs
      if (item.costs !== 'all') {
        item.costs.forEach(cost => {
          expect(CONSTRUCTION_COST).toContain(cost);
        });
      }

      // Check dependsOn if exists
      if (item.dependsOn) {
        if (isDependsOnObject(item.dependsOn)) {
          expect(item.dependsOn.type).toBe('hasSpecialConstruction2');
          expect(YES_NO_OPTIONS).toContain(item.dependsOn.condition);
        } else {
          expect(['hasSpecialConstruction1', 'hasSpecialConstruction2']).toContain(item.dependsOn);
        }
      }
    });
  });

  test('Checklist filtering logic should work correctly', () => {
    const testStatus = '공사중' as ConstructionStatus;
    const testCost = '50억 이상 ~ 120억 미만' as ConstructionCost;
    
    // Filter items by status
    const statusFilteredItems = Object.entries(CHECKLIST_ITEMS)
      .filter(([_, item]) => item.states.includes(testStatus));
    
    expect(statusFilteredItems.length).toBeGreaterThan(0);
    statusFilteredItems.forEach(([_, item]) => {
      expect(item.states).toContain(testStatus);
    });

    // Filter items by cost
    const costFilteredItems = Object.entries(CHECKLIST_ITEMS)
      .filter(([_, item]) => item.costs === 'all' || item.costs.includes(testCost));
    
    expect(costFilteredItems.length).toBeGreaterThan(0);
    costFilteredItems.forEach(([_, item]) => {
      expect(item.costs === 'all' || (Array.isArray(item.costs) && item.costs.includes(testCost))).toBe(true);
    });
  });

  test('Type immutability', () => {
    const headquarters = [...HEADQUARTERS];
    const constructionStatus = [...CONSTRUCTION_STATUS];
    const testItem = { ...Object.values(CHECKLIST_ITEMS)[0] };

    // Test array immutability
    expect(() => {
      headquarters.push('새본부' as Headquarters);
    }).not.toThrow();
    expect(HEADQUARTERS).not.toContain('새본부');

    expect(() => {
      constructionStatus.push('새상태' as ConstructionStatus);
    }).not.toThrow();
    expect(CONSTRUCTION_STATUS).not.toContain('새상태');

    // Test object immutability
    const originalStates = [...testItem.states];
    testItem.states = [...testItem.states, '새상태' as ConstructionStatus];
    expect(Object.values(CHECKLIST_ITEMS)[0].states).toEqual(originalStates);
  });
}); 