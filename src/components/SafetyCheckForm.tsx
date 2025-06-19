'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  HEADQUARTERS,
  BRANCH_OFFICES,
  INSPECTOR_POSITIONS,
  CONSTRUCTION_STATUS,
  CONSTRUCTION_COST,
  CONSTRUCTION_TYPES_1,
  CONSTRUCTION_TYPES_2,
  YES_NO_OPTIONS,
  CHECKLIST_ITEMS,
  CHECK_OPTIONS,
  INSPECTOR_AFFILIATIONS,
  isDependsOnObject,
  type Headquarters,
  type Branch,
  type InspectorPosition,
  type ConstructionStatus,
  type ConstructionCost,
  type YesNo,
  type CheckOption,
  type ChecklistItem,
  type InspectorAffiliation
} from '../constants/checklistData';
import jsPDF from 'jspdf';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface ConstructionTypeListProps {
  types: readonly string[];
  title: 'hasSpecialConstruction1' | 'hasSpecialConstruction2';
  label: string;
  value: YesNo | '';
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ConstructionTypeList: React.FC<ConstructionTypeListProps> = ({ types, title, label, value, onChange }) => (
  <div className="form-group construction-type-item">
    <label className="checklist-label">
      {label}
      <div className="construction-types-list">
        {types.map((type, index) => (
          <div key={index} className="type-item">• {type}</div>
        ))}
      </div>
    </label>
    <div className="radio-group">
      {YES_NO_OPTIONS.map((option: YesNo) => (
        <label key={option} className="radio-label">
          <input
            type="radio"
            name={title}
            value={option}
            checked={value === option}
            onChange={onChange}
          />
          {option}
        </label>
      ))}
    </div>
  </div>
);

interface FormData {
  constructionStatus: ConstructionStatus | '';
  constructionCost: ConstructionCost | '';
  hasSpecialConstruction1: YesNo | '';
  hasSpecialConstruction2: YesNo | '';
  checklistItems: Record<string, CheckOption>;
  headquarters: Headquarters | '';
  branch: Branch | '';
  district: string;
  inspectionDate: string;
  inspectorName: string;
  projectName: string;
  inspectorAffiliation: InspectorAffiliation | '';
}

const SafetyCheckForm: React.FC = () => {
  const [isConstructionSectionCollapsed, setIsConstructionSectionCollapsed] = useState(false);
  const [isChecklistSectionCollapsed, setIsChecklistSectionCollapsed] = useState(true);
  const [isInspectorSectionCollapsed, setIsInspectorSectionCollapsed] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    constructionStatus: '',
    constructionCost: '',
    hasSpecialConstruction1: '',
    hasSpecialConstruction2: '',
    checklistItems: {},
    headquarters: '',
    branch: '',
    district: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectorName: '',
    projectName: '',
    inspectorAffiliation: ''
  });
  const [currentIncompleteIndex, setCurrentIncompleteIndex] = useState<number>(0);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로컬 스토리지에서 폼 데이터 복원
  useEffect(() => {
    const savedData = localStorage.getItem('safetyCheckFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        // 처음 마운트 시에는 showToastMessage를 사용하지 않도록 수정
        setToastMessage('이전에 저장된 데이터를 불러왔습니다.');
        setToastType('success');
        setShowToast(true);
        
        // 3초 후 토스트 메시지 숨기기
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      } catch (error) {
        console.error('저장된 데이터를 불러오는 중 오류가 발생했습니다:', error);
      }
    }
  }, []);

  // 폼 데이터가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    // 초기 상태가 아닐 때만 저장 (초기 렌더링 시 저장 방지)
    if (
      formData.constructionStatus !== '' ||
      formData.constructionCost !== '' ||
      formData.hasSpecialConstruction1 !== '' ||
      formData.hasSpecialConstruction2 !== '' ||
      Object.keys(formData.checklistItems).length > 0 ||
      formData.headquarters !== '' ||
      formData.branch !== '' ||
      formData.district !== '' ||
      formData.inspectorName !== '' ||
      formData.projectName !== '' ||
      formData.inspectorAffiliation !== ''
    ) {
      localStorage.setItem('safetyCheckFormData', JSON.stringify(formData));
    }
  }, [formData]);



  // 데이터 초기화 함수
  const resetFormData = () => {
    if (window.confirm('모든 데이터를 초기화하시겠습니까?')) {
      localStorage.removeItem('safetyCheckFormData');
      setFormData({
        constructionStatus: '',
        constructionCost: '',
        hasSpecialConstruction1: '',
        hasSpecialConstruction2: '',
        checklistItems: {},
        headquarters: '',
        branch: '',
        district: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectorName: '',
        projectName: '',
        inspectorAffiliation: ''
      });
      
      // 섹션 상태 초기화
      setIsConstructionSectionCollapsed(false);  // 공사 여건 선택 섹션 펼치기
      setIsChecklistSectionCollapsed(true);      // 체크리스트 섹션 접기
      setIsInspectorSectionCollapsed(true);      // 점검자 정보 섹션 접기
      
      // 페이지 상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      showToastMessage('데이터가 초기화되었습니다.', 'success');
    }
  };

  const filteredChecklistItems = useMemo(() => {
    // 공사 여건이 하나도 선택되지 않은 경우 모든 항목 반환
    if (!formData.constructionStatus && !formData.constructionCost && 
        !formData.hasSpecialConstruction1 && !formData.hasSpecialConstruction2) {
      return Object.entries(CHECKLIST_ITEMS).reduce((acc, [key, item]) => {
        acc[key] = {
          ...item,
          states: CONSTRUCTION_STATUS,
          costs: 'all',
          dependsOn: undefined,
          subItems: item.subItems ? item.subItems.map(subItem => ({
            title: subItem.title,
            states: undefined,
            costs: undefined,
            dependsOn: undefined
          })) : undefined
        };
        return acc;
      }, {} as Record<string, ChecklistItem>);
    }

    const items: Record<string, ChecklistItem> = {};
    
    (Object.entries(CHECKLIST_ITEMS) as [string, ChecklistItem][]).forEach(([key, value]) => {
      let shouldInclude = true;

      if (formData.constructionStatus && !value.states.includes(formData.constructionStatus)) {
        shouldInclude = false;
      }

      if (value.costs !== 'all' && formData.constructionCost) {
        if (!value.costs.includes(formData.constructionCost)) {
          shouldInclude = false;
        }
      }

      if (value.dependsOn) {
        if (typeof value.dependsOn === 'string') {
          if (value.dependsOn === 'hasSpecialConstruction1' && formData.hasSpecialConstruction1 !== '예') {
            shouldInclude = false;
          }
          if (value.dependsOn === 'hasSpecialConstruction2' && formData.hasSpecialConstruction2 !== '예') {
            shouldInclude = false;
          }
        } else if (isDependsOnObject(value.dependsOn)) {
          if (value.dependsOn.type === 'hasSpecialConstruction2' && 
              formData.hasSpecialConstruction2 !== value.dependsOn.condition) {
            shouldInclude = false;
          }
        }
      }

      if (shouldInclude) {
        items[key] = value;
      }
    });

    return items;
  }, [formData.constructionStatus, formData.constructionCost, formData.hasSpecialConstruction1, formData.hasSpecialConstruction2]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 유해위험방지계획서 대상 공종 선택 시 자동 스크롤
    if (name === 'hasSpecialConstruction1') {
      const nextElementRef = { current: null as HTMLElement | null };
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const element = document.querySelector('[name="hasSpecialConstruction2"]')?.closest('.construction-type-item');
          if (element instanceof HTMLElement) {
            nextElementRef.current = element;
            nextElementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 300);
    }

    if (name.startsWith('checklistItems.')) {
      const newChecklistItems = {
        ...formData.checklistItems,
        [name.replace('checklistItems.', '')]: value as CheckOption
      };

      setFormData(prev => ({
        ...prev,
        checklistItems: newChecklistItems
      }));

      const itemKey = name.replace('checklistItems.', '');
      const [parentItem] = itemKey.split('.');

      // 자동 스크롤 기능
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const currentItem = filteredChecklistItems[parentItem];
          if (currentItem?.subItems) {
            // 테이블 형식인 경우
            const currentRow = e.target.closest('tr');
            const tbody = currentRow?.parentElement;
            if (tbody) {
              const rows = Array.from(tbody.children);
              const currentIndex = rows.indexOf(currentRow);
              const isLastRow = currentIndex === rows.length - 1;

              if (isLastRow) {
                // 마지막 행인 경우 다음 체크리스트로 이동
                const allItems = Object.keys(filteredChecklistItems);
                const nextItemIndex = allItems.indexOf(parentItem) + 1;
                if (nextItemIndex < allItems.length) {
                  const nextElement = document.querySelector(`[data-checklist-item="${allItems[nextItemIndex]}"]`);
                  if (nextElement) {
                    nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              } else {
                // 다음 행으로 이동
                const nextRow = rows[currentIndex + 1];
                if (nextRow) {
                  nextRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }
          } else {
            // 일반 체크리스트 항목인 경우
            const allItems = Object.keys(filteredChecklistItems);
            const nextItemIndex = allItems.indexOf(parentItem) + 1;
            if (nextItemIndex < allItems.length) {
              const nextElement = document.querySelector(`[data-checklist-item="${allItems[nextItemIndex]}"]`);
              if (nextElement) {
                nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }
        }
      }, 100);
    }

    // 공사 여건 관련 필드가 변경될 때
    if (['constructionStatus', 'constructionCost', 'hasSpecialConstruction1', 'hasSpecialConstruction2'].includes(name)) {
      // 변경된 공사 여건으로 새로운 필터링된 체크리스트 항목 계산
      const updatedFormData = {
        ...formData,
        [name]: value
      };

      const newFilteredItems = Object.entries(CHECKLIST_ITEMS).reduce((acc, [key, item]) => {
        let shouldInclude = true;

        if (updatedFormData.constructionStatus && !item.states.includes(updatedFormData.constructionStatus as ConstructionStatus)) {
          shouldInclude = false;
        }

        if (item.costs !== 'all' && updatedFormData.constructionCost) {
          if (!item.costs.includes(updatedFormData.constructionCost as ConstructionCost)) {
            shouldInclude = false;
          }
        }

        if (item.dependsOn) {
          if (typeof item.dependsOn === 'string') {
            if (item.dependsOn === 'hasSpecialConstruction1' && updatedFormData.hasSpecialConstruction1 !== '예') {
              shouldInclude = false;
            }
            if (item.dependsOn === 'hasSpecialConstruction2' && updatedFormData.hasSpecialConstruction2 !== '예') {
              shouldInclude = false;
            }
          } else if (isDependsOnObject(item.dependsOn)) {
            if (item.dependsOn.type === 'hasSpecialConstruction2' && 
                updatedFormData.hasSpecialConstruction2 !== item.dependsOn.condition) {
              shouldInclude = false;
            }
          }
        }

        if (shouldInclude) {
          acc[key] = item;
        }
        return acc;
      }, {} as Record<string, ChecklistItem>);

      // 기존 체크리스트 선택 중 새로운 필터링된 항목에 해당하는 것만 유지
      const updatedChecklistItems = Object.entries(formData.checklistItems).reduce((acc, [key, value]) => {
        const parentItem = key.includes('.') ? key.split('.')[0] : key;
        
        // 새로운 필터링된 항목에 있는 경우에만 유지
        if (newFilteredItems[parentItem]) {
          // 하위 항목인 경우 추가 검사
          if (key.includes('.')) {
            const [parent, subItem] = key.split('.');
            const subItems = newFilteredItems[parent].subItems;
            if (subItems) {
              const matchingSubItem = subItems.find(si => si.title === subItem);
              if (matchingSubItem && (!matchingSubItem.states || 
                  matchingSubItem.states.includes(updatedFormData.constructionStatus as ConstructionStatus))) {
                acc[key] = value;
              }
            }
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {} as Record<string, CheckOption>);

      setFormData(prev => ({
        ...prev,
        [name]: value,
        checklistItems: updatedChecklistItems
      }));

      const isComplete = 
        updatedFormData.constructionStatus !== '' &&
        updatedFormData.constructionCost !== '' &&
        updatedFormData.hasSpecialConstruction1 !== '' &&
        updatedFormData.hasSpecialConstruction2 !== '';

      if (isComplete) {
        setIsConstructionSectionCollapsed(true);
        setIsChecklistSectionCollapsed(false);
      }
    }
  };

  // 공사 여건이 모두 선택되었는지 확인하는 함수
  const isConstructionSettingsComplete = useMemo(() => {
    return formData.constructionStatus !== '' &&
           formData.constructionCost !== '' &&
           formData.hasSpecialConstruction1 !== '' &&
           formData.hasSpecialConstruction2 !== '';
  }, [formData.constructionStatus, formData.constructionCost, 
      formData.hasSpecialConstruction1, formData.hasSpecialConstruction2]);

  // 공사 여건 변경 감지 및 자동 접기
  useEffect(() => {
    if (isConstructionSettingsComplete) {
      // 먼저 스크롤을 맨 위로 이동
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 약간의 지연 후에 섹션 상태 변경
      setTimeout(() => {
        setIsConstructionSectionCollapsed(true);
        setIsChecklistSectionCollapsed(false);
      }, 300); // 스크롤 애니메이션이 완료될 시간을 주기 위해 지연
    }
  }, [isConstructionSettingsComplete]);

  // 체크리스트가 모두 선택되었는지 확인하는 함수
  const isChecklistComplete = useMemo(() => {
    // 전체 체크해야 할 항목 수 계산
    const totalRequiredChecks = Object.entries(filteredChecklistItems).reduce((total, [key, item]) => {
      if (item.subItems) {
        const validSubItems = item.subItems.filter(subItem => {
          const shouldShow = (!subItem.states || subItem.states.includes(formData.constructionStatus as ConstructionStatus)) &&
            (!subItem.costs || subItem.costs === 'all' || !formData.constructionCost || 
             (Array.isArray(subItem.costs) && subItem.costs.includes(formData.constructionCost as ConstructionCost)));
          return shouldShow;
        });
        return total + validSubItems.length;
      }
      return total + 1;
    }, 0);

    // 현재 체크된 유효한 항목 수 계산
    const currentCheckedItems = Object.entries(formData.checklistItems).reduce((total, [key, value]) => {
      const parentItem = key.includes('.') ? key.split('.')[0] : key;
      const item = filteredChecklistItems[parentItem];
      
      if (item) {
        if (key.includes('.')) {
          // 하위 항목인 경우
          const [parent, subItemTitle] = key.split('.');
          const subItem = item.subItems?.find(si => si.title === subItemTitle);
          
          if (subItem) {
            const shouldShow = (!subItem.states || subItem.states.includes(formData.constructionStatus as ConstructionStatus)) &&
              (!subItem.costs || subItem.costs === 'all' || !formData.constructionCost || 
               (Array.isArray(subItem.costs) && subItem.costs.includes(formData.constructionCost as ConstructionCost)));
            
            if (shouldShow) {
              return total + 1;
            }
          }
        } else {
          // 일반 항목인 경우
          return total + 1;
        }
      }
      return total;
    }, 0);

    return currentCheckedItems === totalRequiredChecks && currentCheckedItems > 0;
  }, [filteredChecklistItems, formData.checklistItems, formData.constructionStatus, formData.constructionCost]);

  // 체크리스트가 완료되면 자동으로 섹션을 접고 점검자 정보 섹션을 펼침
  useEffect(() => {
    if (isChecklistComplete) {
      // 먼저 스크롤을 맨 위로 이동
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 약간의 지연 후에 섹션 상태 변경
      setTimeout(() => {
        setIsChecklistSectionCollapsed(true);
        setIsInspectorSectionCollapsed(false);
      }, 300); // 스크롤 애니메이션이 완료될 시간을 주기 위해 지연
    }
  }, [isChecklistComplete]);

  // 점검자 정보가 모두 입력되었는지 확인하는 함수
  const isInspectorInfoComplete = useMemo(() => {
    return formData.headquarters !== '' &&
           formData.branch !== '' &&
           formData.inspectorName.trim() !== '' &&
           formData.inspectionDate !== '' &&
           formData.projectName.trim() !== '' &&
           formData.inspectorAffiliation !== '';
  }, [formData.headquarters, formData.branch, formData.inspectorName, formData.inspectionDate, formData.projectName, formData.inspectorAffiliation]);

  // 점검자 정보 섹션 클릭 핸들러
  const handleInspectorSectionClick = (e: React.MouseEvent) => {
    // 클릭된 요소가 입력 필드나 버튼이 아닐 때만 접기
    if (
      isInspectorInfoComplete &&
      !(e.target instanceof HTMLInputElement) &&
      !(e.target instanceof HTMLSelectElement) &&
      !(e.target instanceof HTMLButtonElement) &&
      !(e.target instanceof HTMLLabelElement)
    ) {
      setIsInspectorSectionCollapsed(true);
    }
  };

  // 점검자 정보 입력 필드 키 입력 핸들러
  const handleInspectorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isInspectorInfoComplete) {
      setIsInspectorSectionCollapsed(true);
    }
  };

  const generatePDF = async () => {
    if (typeof window === 'undefined') return;

    try {
      const doc = new jsPDF();
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas context creation failed');
      }

      canvas.width = 2480; // A4 width at 300 DPI
      canvas.height = 3508; // A4 height at 300 DPI
      
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#000000';
      context.textBaseline = 'middle';

      const logoImg = new Image();
      logoImg.src = '/KRCPNG.png';
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        setTimeout(reject, 5000);
      });

      const logoWidth = 200;
      const logoHeight = (logoWidth * logoImg.height) / logoImg.width;
      context.drawImage(logoImg, 200, 150, logoWidth, logoHeight);

      context.font = 'bold 80px sans-serif';
      context.textAlign = 'left';
      context.fillText('안전서류 점검 결과', 450, 200);

      const projectNameText = `[${formData.projectName}]`;
      context.font = 'bold 70px sans-serif';
      const projectNameWidth = context.measureText(projectNameText).width;
      const boxPadding = 40;
      const boxWidth = projectNameWidth + (boxPadding * 2);
      const boxHeight = 100;
      const boxX = (canvas.width - boxWidth) / 2;
      const boxY = 350;

      context.fillStyle = '#f8f9fa';
      context.strokeStyle = '#e5e7eb';
      context.lineWidth = 3;
      context.beginPath();
      context.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
      context.fill();
      context.stroke();

      context.fillStyle = '#000000';
      context.textAlign = 'center';
      context.fillText(projectNameText, canvas.width / 2, boxY + (boxHeight / 2) + 10);

      const constructionData: Array<[string, string]> = [
        ['공사 상태', formData.constructionStatus],
        ['총공사비 규모', formData.constructionCost],
        ['유해위험방지계획서', formData.hasSpecialConstruction1],
        ['안전관리계획서', formData.hasSpecialConstruction2]
      ];

      const inspectorData: Array<[string, string]> = [
        ['본부(점검대상)', formData.headquarters],
        ['지사(점검대상)', formData.branch],
        ['점검자 소속', formData.inspectorAffiliation],
        ['점검자명', formData.inspectorName],
        ['점검일자', formData.inspectionDate]
      ];

      const startX = 200;
      let currentY = 550;

      const drawTable = (x: number, y: number, title: string, rows: Array<[string, string]>, options: {
        width?: number;
        isChecklist?: boolean;
      } = {}) => {
        // 테이블 폭 계산
        let maxLabelWidth = 0;
        let maxValueWidth = 0;

        context.font = '45px sans-serif';
        rows.forEach(([label, value]) => {
          const labelWidth = context.measureText(`• ${label}`).width;
          const valueWidth = context.measureText(`: ${value}`).width;
          maxLabelWidth = Math.max(maxLabelWidth, labelWidth);
          maxValueWidth = Math.max(maxValueWidth, valueWidth);
        });

        // 여백을 포함한 테이블 전체 폭 계산
        const padding = 60;
        const minTableWidth = 900; // 테이블 최소 폭을 900으로 조정
        const tableWidth = Math.max(
          minTableWidth,
          maxLabelWidth + maxValueWidth + padding * 4
        );

        // 테이블이 페이지 여백을 침범하지 않도록 조정
        const maxTableWidth = 1000; // 최대 테이블 폭 제한
        const finalTableWidth = Math.min(tableWidth, maxTableWidth);

        const rowHeight = 80;
        const cellPadding = 30;
        
        if (title) {
          context.font = 'bold 50px sans-serif';
          context.textAlign = 'left';
          context.fillStyle = '#000000';
          context.fillText(`■ ${title}`, x, y);
          y += 80;
        }

        rows.forEach(([label, value], index) => {
          context.fillStyle = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
          context.fillRect(x, y, finalTableWidth, rowHeight);
          
          context.strokeStyle = '#e5e7eb';
          context.lineWidth = 2;
          context.strokeRect(x, y, finalTableWidth, rowHeight);
          
          context.fillStyle = options.isChecklist && value === '불이행' ? '#ff0000' : '#000000';
          context.font = '45px sans-serif';
          context.textAlign = 'left';
          
          const labelX = x + cellPadding;
          const valueX = x + finalTableWidth * 0.50;
          
          // 텍스트가 너무 길 경우 줄임 처리
          const maxLabelSpace = finalTableWidth * 0.45 - cellPadding * 2;
          const maxValueSpace = finalTableWidth * 0.45 - cellPadding * 2;
          
          let displayLabel = `• ${label}`;
          let displayValue = `: ${value}`;
          
          // 레이블이 너무 길 경우 줄임 처리
          if (context.measureText(displayLabel).width > maxLabelSpace) {
            while (context.measureText(displayLabel + '...').width > maxLabelSpace && displayLabel.length > 4) {
              displayLabel = displayLabel.slice(0, -1);
            }
            displayLabel += '...';
          }
          
          // 값이 너무 길 경우 줄바꿈 처리
          let valueLines = [];
          let currentLine = '';
          const words = value.split(' ');
          
          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (context.measureText(': ' + testLine).width <= maxValueSpace) {
              currentLine = testLine;
            } else {
              if (currentLine) valueLines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) valueLines.push(currentLine);
          
          if (valueLines.length === 0) valueLines = [value];
          
          // 레이블 그리기
          context.fillText(displayLabel + ' :', labelX, y + rowHeight/2);
          
          // 여러 줄의 값 그리기
          const lineHeight = 45;
          valueLines.forEach((line, index) => {
            context.fillText(` ${line}`, valueX, y + (rowHeight/2) - ((valueLines.length - 1) * lineHeight/2) + (index * lineHeight));
          });
          
          y += rowHeight + (valueLines.length > 1 ? (valueLines.length - 1) * lineHeight : 0);
        });
        
        return y + 30;
      };

      // 공사 여건과 점검자 정보 테이블 그리기
      const constructionY = drawTable(startX, currentY, '공사 여건', constructionData);
      drawTable(startX + 1200, currentY, '점검자 정보', inspectorData); // 간격을 1200으로 증가

      currentY += 700;

      const checklistTitle = '■ 체크리스트 결과';
      const titleWidth = context.measureText(checklistTitle).width;

      const counts = Object.values(formData.checklistItems).reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {} as Record<CheckOption, number>);

      const summaryText = `(이행: ${counts['이행'] || 0}건, 불이행: ${counts['불이행'] || 0}건, 해당없음: ${counts['해당없음'] || 0}건)`;
      const summaryWidth = context.measureText(summaryText).width;

      context.font = 'bold 50px sans-serif';
      context.textAlign = 'left';
      context.fillStyle = '#000000';
      context.fillText(checklistTitle, 200, currentY);

      context.font = '40px sans-serif';
      context.fillStyle = '#666666';
      context.fillText(summaryText, 200 + titleWidth + 40, currentY);

      const checklistData: Array<[string, CheckOption]> = Object.entries(formData.checklistItems)
        .filter(([item]) => {
          const parentItem = item.includes('.') ? item.split('.')[0] : item;
          return Object.keys(filteredChecklistItems).includes(parentItem);
        })
        .map(([item, value], index) => {
          if (item.includes('.')) {
            const [parentItem, subItem] = item.split('.');
            return [`${index + 1}. ${parentItem} - ${subItem}`, value];
          }
          return [`${index + 1}. ${item}`, value];
        });

      // 체크리스트 테이블의 전체 폭 계산 (페이지 여백 제외)
      const pageMargin = 200;
      const maxChecklistWidth = canvas.width - (pageMargin * 2);

      const drawChecklistTable = (startY: number, items: Array<[string, CheckOption]>) => {
        const rowHeight = 80;
        const maxY = canvas.height - 200;
        let currentY = startY;
        let drawnItems = 0;

        items.forEach(([label, value], index) => {
          if (currentY + rowHeight > maxY) {
            // 현재 페이지 저장
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            doc.addImage(dataUrl, 'JPEG', 0, 0, 210, 297);
            doc.addPage();
            
            // 새 페이지 초기화
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            currentY = 100;

            context.font = 'bold 50px sans-serif';
            context.textAlign = 'left';
            context.fillStyle = '#000000';
            context.fillText('■ 체크리스트 결과 (계속)', 200, currentY);
            currentY += 80;
          }

          context.fillStyle = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
          context.fillRect(pageMargin, currentY, maxChecklistWidth, rowHeight);
          
          context.strokeStyle = '#e5e7eb';
          context.lineWidth = 2;
          context.strokeRect(pageMargin, currentY, maxChecklistWidth, rowHeight);
          
          context.fillStyle = value === '불이행' ? '#ff0000' : '#000000';
          context.font = '45px sans-serif';
          context.textAlign = 'left';
          
          // 레이블과 값의 위치 조정
          const labelX = pageMargin + 30;
          const valueX = pageMargin + maxChecklistWidth - 300;
          
          // 레이블 텍스트가 값 영역을 침범하지 않도록 최대 폭 계산
          const maxLabelWidth = valueX - labelX - 50;
          let displayLabel = label;
          
          // 텍스트를 여러 줄로 나누기
          const words = displayLabel.split(' ');
          let lines = [''];
          let currentLine = 0;
          
          words.forEach(word => {
            const testLine = lines[currentLine] + (lines[currentLine] ? ' ' : '') + word;
            if (context.measureText(testLine).width <= maxLabelWidth) {
              lines[currentLine] = testLine;
            } else {
              currentLine++;
              lines[currentLine] = word;
            }
          });

          // 최대 3줄까지만 표시하고 나머지는 ...으로 처리
          const maxLines = 3;
          if (lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            lines[maxLines - 1] = lines[maxLines - 1].slice(0, -3) + '...';
          }

          // 여러 줄 텍스트 그리기
          const lineHeight = 45;
          lines.forEach((line, index) => {
            context.fillText(line, labelX, currentY + (rowHeight/2) - ((lines.length - 1) * lineHeight/2) + (index * lineHeight));
          });
          
          // 값 텍스트 그리기
          context.fillText(`: ${value}`, valueX, currentY + rowHeight/2);
          
          currentY += rowHeight + (lines.length > 1 ? (lines.length - 1) * 20 : 0); // 여러 줄인 경우 추가 높이
          drawnItems++;
        });

        return currentY;
      };

      currentY = drawChecklistTable(currentY + 80, checklistData);

      // 첫 페이지 저장
      const firstPageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(firstPageDataUrl, 'JPEG', 0, 0, 210, 297);

      doc.save(`안전서류_점검결과_${formData.projectName}.pdf`);
    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      showToastMessage('PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    }
  };

  const handleSubmit = async () => {
    // 제출 전 확인 메시지
    if (!window.confirm('점검결과보고서를 받으셨습니까?')) {
      return; // 아니요 선택 시 제출 취소
    }
    
    try {
      // 제출 진행 중 메시지 표시
      showToastMessage('제출 진행 중...', 'success');
      
      // 구글 스크립트 엔드포인트
      const scriptURL = 'https://script.google.com/macros/s/AKfycbyKCSXEaXespeoXn-bSBQdRTFNFxPWetWGtU9cw-NmfIEgLqNwEMasWPGcD2_JrH9w/exec';
      
      // 체크리스트 항목 값 확인
      console.log('체크리스트 항목들:', formData.checklistItems);
      
      // FormData 객체 생성
      const submitFormData = new FormData();
      
      // 기본 필드 추가
      const baseFields = {
        constructionStatus: formData.constructionStatus || '',
        constructionCost: formData.constructionCost || '',
        hasSpecialConstruction1: formData.hasSpecialConstruction1 || '',
        hasSpecialConstruction2: formData.hasSpecialConstruction2 || '',
        headquarters: formData.headquarters || '',
        branch: formData.branch || '',
        inspectionDate: formData.inspectionDate || '',
        inspectorName: formData.inspectorName || '',
        projectName: formData.projectName || '',
        inspectorAffiliation: formData.inspectorAffiliation || ''
      };
      
      // 기본 필드 입력
      Object.entries(baseFields).forEach(([key, value]) => {
        submitFormData.append(key, value);
      });
      
      // 체크리스트 항목 추가
      Object.entries(formData.checklistItems).forEach(([key, value]) => {
        submitFormData.append(key, value || '');
      });
      
      // 로딩 상태 설정
      setIsSubmitting(true);
      
      // fetch를 사용하여 직접 데이터 제출
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: submitFormData,
        mode: 'no-cors' // CORS 문제 방지
      });
      
      // 제출 완료
      setIsSubmitting(false);
      
      // 성공 메시지 표시
      showToastMessage('데이터를 성공적으로 제출했습니다.', 'success');
      
      // 제출 완료 후 로컬 스토리지 클리어
      localStorage.removeItem('safetyCheckFormData');
      
      // 잠시 후 처음 화면으로 자동 이동
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (error) {
      console.error('제출 중 오류 발생:', error);
      setIsSubmitting(false);
      showToastMessage('제출 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
  };

  // 미완료 항목 찾기 함수
  const findIncompleteItems = () => {
    return Object.keys(filteredChecklistItems).reduce<string[]>((acc, item) => {
      const checklistItem = filteredChecklistItems[item];
      
      if (checklistItem.subItems) {
        // 하위 항목이 있는 경우, 모든 하위 항목이 체크되었는지 확인
        const uncheckedSubItems = checklistItem.subItems
          .filter(subItem => {
            // 현재 상태와 비용에 해당하는 항목만 필터링
            const shouldShow = (!subItem.states || subItem.states.includes(formData.constructionStatus as ConstructionStatus)) &&
              (!subItem.costs || subItem.costs === 'all' || !formData.constructionCost || 
               (Array.isArray(subItem.costs) && subItem.costs.includes(formData.constructionCost as ConstructionCost)));
            
            if (shouldShow) {
              const key = `${item}.${subItem.title}`;
              return formData.checklistItems[key] === undefined;
            }
            return false;
          });
        
        if (uncheckedSubItems.length > 0) {
          acc.push(item);
        }
      } else {
        // 하위 항목이 없는 경우
        if (formData.checklistItems[item] === undefined) {
          acc.push(item);
        }
      }
      return acc;
    }, []);
  };

  // 플로팅 아이콘 클릭 핸들러
  const handleFloatingButtonClick = () => {
    const incompleteItems = findIncompleteItems();
    if (incompleteItems.length === 0) return;

    // 다음 미완료 항목 인덱스 계산
    const nextIndex = (currentIncompleteIndex + 1) % incompleteItems.length;
    setCurrentIncompleteIndex(nextIndex);

    const itemKey = incompleteItems[nextIndex];
    const parentItem = itemKey.includes('.') ? itemKey.split('.')[0] : itemKey;
    
    // 해당 항목 찾기
    const element = document.querySelector(`[data-checklist-item="${parentItem}"]`) as HTMLElement;
    if (element) {
      // 스크롤 이동
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // 애니메이션 효과 추가
      element.classList.remove('highlight-animation');
      void element.offsetWidth; // 리플로우 트리거
      element.classList.add('highlight-animation');
    }
  };

  const isItemComplete = (itemKey: string) => {
    const item = CHECKLIST_ITEMS[itemKey];
    
    // 하위 항목이 있는 경우
    if (item.subItems) {
      // 모든 하위 항목이 체크되어 있는지 확인
      return item.subItems.every((subItem) => {
        const subItemKey = `${itemKey}.${subItem.title}`;
        return formData.checklistItems[subItemKey] !== undefined;
      });
    }
    
    // 하위 항목이 없는 경우
    return formData.checklistItems[itemKey] !== undefined;
  };

  // 설명 텍스트 접기/펼치기 핸들러 추가
  const toggleDescription = (key: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 설명 텍스트의 줄 수를 계산하는 함수 추가
  const calculateLines = (text: string): number => {
    const lineHeight = 1.5; // line-height 값
    const fontSize = 14; // text-sm의 font-size (px)
    const containerWidth = 800; // 컨테이너의 대략적인 너비 (px)
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    
    context.font = `${fontSize}px sans-serif`;
    const words = text.split(' ');
    let line = '';
    let lineCount = 1;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = context.measureText(testLine);
      if (metrics.width > containerWidth) {
        line = word + ' ';
        lineCount++;
      } else {
        line = testLine;
      }
    }
    
    return lineCount;
  };

  // 클립보드에 텍스트 복사하는 함수
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          showToastMessage('URL이 클립보드에 복사되었습니다.', 'success');
        })
        .catch(err => {
          console.error('클립보드 복사 실패:', err);
          fallbackCopyToClipboard(text);
        });
    } else {
      fallbackCopyToClipboard(text);
    }
  };

  // 구형 브라우저를 위한 대체 복사 방법
  const fallbackCopyToClipboard = (text: string) => {
    // 임시 텍스트 영역 생성
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 화면에서 보이지 않게 설정
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    // 텍스트 선택 및 복사
    textArea.focus();
    textArea.select();
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
    
    // 임시 요소 제거
    document.body.removeChild(textArea);
    
    // 사용자에게 피드백 제공
    if (success) {
      showToastMessage('링크가 클립보드에 복사되었습니다.', 'success');
    } else {
      showToastMessage('링크 복사에 실패했습니다. 직접 URL을 복사해주세요.', 'error');
    }
  };

  // 토스트 메시지 표시 함수
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type === 'info' ? 'success' : type);
    setShowToast(true);
    
    // 3초 후 토스트 메시지 숨기기
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <>
      {/* 토스트 메시지 */}
      {showToast && (
        <div 
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-4 rounded-lg shadow-xl text-white ${
            toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
          } transition-opacity duration-300 flex items-center min-w-[300px] justify-center`}
        >
          <span className="text-xl font-medium">{toastMessage}</span>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-3xl mx-auto px-5 py-2">
          <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
            <a 
              href="https://www.ekr.or.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img src="/icon-192x192.png" alt="한국농어촌공사 로고" className="h-8 w-auto" />
            </a>
            <button
              className="text-base sm:text-lg md:text-[1.4rem] lg:text-2xl font-bold text-[var(--apple-text)] text-center max-[1023px]:text-[1.4rem] max-[450px]:text-lg max-[400px]:text-base max-[350px]:text-sm hover:opacity-80 transition-opacity cursor-pointer"
            >
              안전서류 점검시스템
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={resetFormData}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                aria-label="데이터 초기화"
                title="데이터 초기화"
              >
                초기화
              </button>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="메뉴 열기"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 전파하기 버튼 추가 */}
      <div className="fixed top-[65px] left-0 right-0 z-40 flex justify-center">
        <div className="max-w-3xl w-full px-4 py-2 flex justify-end">
          <button
            onClick={() => {
              // 현재 URL 가져오기
              const url = "https://krcsafedocu.vercel.app/";
              
              // 모바일 기기 확인
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              
              if (isMobile && navigator.share) {
                // 모바일 기기에서 Web Share API 사용
                navigator.share({
                  title: '안전서류 점검시스템',
                  text: '한국농어촌공사 안전서류 점검시스템을 확인해보세요.',
                  url: url
                }).catch(err => {
                  // AbortError는 사용자가 공유를 취소한 경우
                  if (err.name !== 'AbortError') {
                    console.error('공유하기 실패:', err);
                    // 공유 실패 시에만 클립보드 복사로 대체
                    copyToClipboard(url);
                  }
                });
              } else {
                // 데스크톱에서는 클립보드에 복사
                copyToClipboard(url);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-full shadow-md transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            전파하기
          </button>
        </div>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container pt-20">
        {/* 체크리스트 진행 상황 플로팅 표시 수정 */}
        {!isChecklistSectionCollapsed && (
          <button
            onClick={handleFloatingButtonClick}
            className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg animate-fade-in z-50 hover:bg-red-700 transition-colors cursor-pointer"
          >
            진행상황 {Object.keys(formData.checklistItems).length}/{Object.entries(filteredChecklistItems).reduce((total, [key, item]) => {
              if (item.subItems) {
                const validSubItems = item.subItems.filter(subItem => {
                  const shouldShow = (!subItem.states || subItem.states.includes(formData.constructionStatus as ConstructionStatus)) &&
                    (!subItem.costs || subItem.costs === 'all' || !formData.constructionCost || 
                     (Array.isArray(subItem.costs) && subItem.costs.includes(formData.constructionCost as ConstructionCost)));
                  
                  if (subItem.dependsOn) {
                    if (typeof subItem.dependsOn === 'string') {
                      if (subItem.dependsOn === 'hasSpecialConstruction1' && formData.hasSpecialConstruction1 !== '예') {
                        return false;
                      }
                      if (subItem.dependsOn === 'hasSpecialConstruction2' && formData.hasSpecialConstruction2 !== '예') {
                        return false;
                      }
                    } else if (isDependsOnObject(subItem.dependsOn)) {
                      if (subItem.dependsOn.type === 'hasSpecialConstruction2' && 
                          formData.hasSpecialConstruction2 !== subItem.dependsOn.condition) {
                        return false;
                      }
                    }
                  }
                  
                  return shouldShow;
                });
                return total + validSubItems.length;
              }
              return total + 1;
            }, 0)} 완료
          </button>
        )}
        
        {isConstructionSettingsComplete && isChecklistComplete && isInspectorInfoComplete && (
          <div className="sticky top-0 z-40 bg-white py-4 border-b border-gray-200 mb-6 animate-fade-in">
            <div className="flex justify-center gap-4">
              <button
                onClick={generatePDF}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                결과 저장하기(PDF)
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-3 text-white rounded-lg transition-colors text-lg font-medium flex items-center gap-2 ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                )}
                {isSubmitting ? '제출 중...' : '제출하기'}
              </button>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-5">
          <div className={`card relative transition-all duration-500 ease-in-out ${
            isConstructionSectionCollapsed ? 'order-2' : 'order-1'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">공사 여건 선택</h2>
              <button
                onClick={() => {
                  setIsConstructionSectionCollapsed(!isConstructionSectionCollapsed);
                  if (!isConstructionSectionCollapsed) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isConstructionSectionCollapsed ? '펼치기 ▼' : '접기 ▲'}
              </button>
            </div>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isConstructionSectionCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
            }`}>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label>공사 상태</label>
                  <select 
                    name="constructionStatus"
                    value={formData.constructionStatus}
                    onChange={handleChange}
                    className="select-control"
                  >
                    <option value="">선택하세요</option>
                    {CONSTRUCTION_STATUS.map((status: ConstructionStatus) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>총공사비 규모</label>
                  <select
                    name="constructionCost"
                    value={formData.constructionCost}
                    onChange={handleChange}
                    className="select-control"
                  >
                    <option value="">선택하세요</option>
                    {CONSTRUCTION_COST.map((cost: ConstructionCost) => (
                      <option key={cost} value={cost}>{cost}</option>
                    ))}
                  </select>
                </div>
              </div>

              <ConstructionTypeList
                types={CONSTRUCTION_TYPES_1}
                title="hasSpecialConstruction1"
                label="유해위험방지계획서 대상 공종 포함 여부"
                value={formData.hasSpecialConstruction1}
                onChange={handleChange}
              />

              <ConstructionTypeList
                types={CONSTRUCTION_TYPES_2}
                title="hasSpecialConstruction2"
                label="안전관리계획서 수립 대상 공종 포함 여부"
                value={formData.hasSpecialConstruction2}
                onChange={handleChange}
              />
            </div>

            {isConstructionSectionCollapsed && isConstructionSettingsComplete && (
              <div className="py-4 px-6 bg-gray-50 rounded-lg mt-2">
                <p className="text-sm text-gray-600">
                  공사 상태: {formData.constructionStatus}<br />
                  총공사비 규모: {formData.constructionCost}<br />
                  유해위험방지계획서: {formData.hasSpecialConstruction1}<br />
                  안전관리계획서: {formData.hasSpecialConstruction2}
                </p>
              </div>
            )}
          </div>

          <div 
            data-section="checklist"
            className={`card relative transition-all duration-500 ease-in-out ${
              isChecklistSectionCollapsed ? 'order-3' : isConstructionSectionCollapsed ? 'order-1' : 'order-2'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">안전서류 체크리스트</h2>
              <button
                onClick={() => setIsChecklistSectionCollapsed(!isChecklistSectionCollapsed)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isChecklistSectionCollapsed ? '펼치기 ▼' : '접기 ▲'}
              </button>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isChecklistSectionCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
            }`}>
              {Object.keys(filteredChecklistItems).length === 0 ? (
                <p className="text-gray-500 text-center py-4">체크리스트 항목이 없습니다.</p>
              ) : (
                <div>
                  {!isConstructionSettingsComplete && (
                    <p className="text-amber-600 mb-4 p-4 bg-amber-50 rounded-lg">
                      ※ 공사 여건을 선택하시면 해당되는 체크리스트 항목만 필터링됩니다.
                    </p>
                  )}
                  <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                    {Object.entries(filteredChecklistItems).map(([key, item]) => (
                      <div 
                        key={key} 
                        data-checklist-item={key}
                        className={`mb-4 last:mb-0 p-4 rounded-lg bg-gray-50`}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <label className="block font-medium text-lg">{key}</label>
                          {item.description && calculateLines(item.description) > 4 && (
                            <button
                              onClick={() => toggleDescription(key)}
                              className="text-blue-600 hover:text-blue-800 text-sm bg-white shadow-sm border border-gray-200 px-3 py-1 rounded-md"
                            >
                              {expandedDescriptions[key] ? '▲' : '▼'}
                            </button>
                          )}
                        </div>
                        {item.description && (
                          <div className="relative mb-2">
                            <div className="relative">
                              <p 
                                className={`text-sm text-gray-600 whitespace-pre-wrap ${!expandedDescriptions[key] ? 'line-clamp-4' : ''}`}
                                dangerouslySetInnerHTML={{ __html: item.description.replace(/\n/g, '<br>') || '' }}
                              />
                              {!expandedDescriptions[key] && calculateLines(item.description) > 4 && (
                                <div 
                                  className="absolute bottom-0 left-0 right-0 text-center bg-gradient-to-t from-gray-50 pt-4 cursor-pointer flex justify-center items-center gap-1 hover:opacity-80 transition-opacity"
                                  onClick={() => toggleDescription(key)}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {item.subItems ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="border border-gray-300 bg-gray-50 p-2 text-center w-[60%]">항목</th>
                                  <th className="border border-gray-300 bg-gray-50 p-2 text-center w-[13%]">이행</th>
                                  <th className="border border-gray-300 bg-gray-50 p-2 text-center w-[13%]">불이행</th>
                                  <th className="border border-gray-300 bg-gray-50 p-2 text-center w-[14%]">해당없음</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.subItems.map((subItem, index) => {
                                  const shouldShow = (!subItem.states || subItem.states.includes(formData.constructionStatus as ConstructionStatus)) &&
                                    (!subItem.costs || subItem.costs === 'all' || !formData.constructionCost || 
                                     (Array.isArray(subItem.costs) && subItem.costs.includes(formData.constructionCost as ConstructionCost)));

                                  if (!shouldShow) return null;

                                  return (
                                    <tr key={index} className="border-b border-gray-200">
                                      <td className="border border-gray-300 p-2">{subItem.title}</td>
                                      {CHECK_OPTIONS.map((option) => (
                                        <td key={option} className="border border-gray-300 p-2 text-center">
                                          <input
                                            type="radio"
                                            name={`checklistItems.${key}.${subItem.title}`}
                                            value={option}
                                            checked={formData.checklistItems[`${key}.${subItem.title}`] === option}
                                            onChange={handleChange}
                                            className="w-4 h-4"
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="radio-group">
                            {CHECK_OPTIONS.map((option) => (
                              <label key={option} className="radio-label">
                                <input
                                  type="radio"
                                  name={`checklistItems.${key}`}
                                  value={option}
                                  checked={formData.checklistItems[key] === option}
                                  onChange={handleChange}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isChecklistSectionCollapsed && Object.keys(formData.checklistItems).length > 0 && (
              <div className="py-4 px-6 bg-gray-50 rounded-lg mt-2">
                <p className="text-sm text-gray-600">
                  {(() => {
                    // 전체 체크해야 할 항목 수 계산
                    const totalRequiredChecks = Object.entries(filteredChecklistItems).reduce((total, [key, item]) => {
                      if (item.subItems) {
                        const validSubItems = item.subItems.filter(subItem => {
                          const shouldShow = (!subItem.states || subItem.states.includes(formData.constructionStatus as ConstructionStatus)) &&
                            (!subItem.costs || subItem.costs === 'all' || !formData.constructionCost || 
                             (Array.isArray(subItem.costs) && subItem.costs.includes(formData.constructionCost as ConstructionCost)));
                          
                          if (shouldShow && subItem.dependsOn) {
                            if (typeof subItem.dependsOn === 'string') {
                              if (subItem.dependsOn === 'hasSpecialConstruction1' && formData.hasSpecialConstruction1 !== '예') {
                                return false;
                              }
                              if (subItem.dependsOn === 'hasSpecialConstruction2' && formData.hasSpecialConstruction2 !== '예') {
                                return false;
                              }
                            } else if (isDependsOnObject(subItem.dependsOn)) {
                              if (subItem.dependsOn.type === 'hasSpecialConstruction2' && 
                                  formData.hasSpecialConstruction2 !== subItem.dependsOn.condition) {
                                return false;
                              }
                            }
                          }
                          return shouldShow;
                        });
                        return total + validSubItems.length;
                      }
                      return total + 1;
                    }, 0);

                    const counts = Object.entries(formData.checklistItems).reduce((acc, [key, value]) => {
                      // 해당 항목이 현재 필터링된 항목에 포함되는지 확인
                      const parentItem = key.includes('.') ? key.split('.')[0] : key;
                      const item = filteredChecklistItems[parentItem];
                      
                      if (item) {
                        if (key.includes('.')) {
                          // 하위 항목인 경우
                          const [parent, subItemTitle] = key.split('.');
                          const subItem = item.subItems?.find(si => si.title === subItemTitle);
                          
                          if (subItem) {
                            const shouldShow = (!subItem.states || subItem.states.includes(formData.constructionStatus as ConstructionStatus)) &&
                              (!subItem.costs || subItem.costs === 'all' || !formData.constructionCost || 
                               (Array.isArray(subItem.costs) && subItem.costs.includes(formData.constructionCost as ConstructionCost)));
                            
                            if (shouldShow) {
                              acc[value] = (acc[value] || 0) + 1;
                            }
                          }
                        }
                      } else {
                        // 일반 항목인 경우
                        acc[value] = (acc[value] || 0) + 1;
                      }
                      return acc;
                    }, {} as Record<CheckOption, number>);

                    return (
                      <>
                        총 체크리스트 항목: {totalRequiredChecks}개<br />
                        이행: {counts['이행'] || 0}개<br />
                        불이행: {counts['불이행'] || 0}개<br />
                        해당없음: {counts['해당없음'] || 0}개
                      </>
                    );
                  })()}
                </p>
              </div>
            )}
          </div>

          <div className={`card relative transition-all duration-500 ease-in-out ${
            isInspectorSectionCollapsed ? 'order-3' : isChecklistSectionCollapsed ? 'order-1' : 'order-3'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">점검자 정보</h2>
              <button
                onClick={() => setIsInspectorSectionCollapsed(!isInspectorSectionCollapsed)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isInspectorSectionCollapsed ? '펼치기 ▼' : '접기 ▲'}
              </button>
            </div>

            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isInspectorSectionCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
              }`}
              onClick={handleInspectorSectionClick}
            >
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label>사업명(점검대상)</label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    onKeyDown={handleInspectorKeyDown}
                    className="select-control placeholder-gray-400"
                    placeholder="예) 00지구 배수개선사업"
                  />
                </div>

                <div className="form-group flex-1">
                  <label>점검일자</label>
                  <input
                    type="date"
                    name="inspectionDate"
                    value={formData.inspectionDate}
                    onChange={handleChange}
                    onKeyDown={handleInspectorKeyDown}
                    className="select-control"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label>본부(점검대상)</label>
                  <select
                    name="headquarters"
                    value={formData.headquarters}
                    onChange={handleChange}
                    className="select-control"
                  >
                    <option value="">선택하세요</option>
                    {HEADQUARTERS.map((hq: Headquarters) => (
                      <option key={hq} value={hq}>{hq}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>지사(점검대상)</label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="select-control"
                    disabled={!formData.headquarters}
                  >
                    <option value="">선택하세요</option>
                    {formData.headquarters && BRANCH_OFFICES[formData.headquarters]?.map((branch: Branch) => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label>점검자 소속</label>
                  <select
                    name="inspectorAffiliation"
                    value={formData.inspectorAffiliation}
                    onChange={handleChange}
                    onKeyDown={handleInspectorKeyDown}
                    className="select-control"
                  >
                    <option value="">선택하세요</option>
                    {INSPECTOR_AFFILIATIONS.map((affiliation: InspectorAffiliation) => (
                      <option key={affiliation} value={affiliation}>{affiliation}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>점검자명</label>
                  <input
                    type="text"
                    name="inspectorName"
                    value={formData.inspectorName}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isInspectorInfoComplete) {
                        e.preventDefault();
                        setIsInspectorSectionCollapsed(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    onBlur={() => {
                      if (isInspectorInfoComplete) {
                        setIsInspectorSectionCollapsed(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="select-control placeholder-gray-400"
                    placeholder="예) 4급 홍길동"
                  />
                </div>
              </div>
            </div>

            {isInspectorSectionCollapsed && isInspectorInfoComplete && (
              <div className="py-4 px-6 bg-gray-50 rounded-lg mt-2">
                <p className="text-sm text-gray-600">
                  사업명: {formData.projectName}<br />
                  본부: {formData.headquarters}<br />
                  지사: {formData.branch}<br />
                  점검자 소속: {formData.inspectorAffiliation}<br />
                  점검자명: {formData.inspectorName}<br />
                  점검일자: {formData.inspectionDate}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="py-8 mt-8 text-center text-sm text-gray-600 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <p className="mb-2">
            © 2025 이 시스템의 모든 권리는 한국농어촌공사 경기지역본부, 충남지역본부에 있습니다.
          </p>
          <p className="mb-4">무단 복제 및 배포를 금지합니다.</p>
          <p>
            문의 : 윤혁(<a href="tel:031-250-3611" className="text-blue-600 hover:underline">031-250-3611</a>), 
            임원일(<a href="tel:041-339-1844" className="text-blue-600 hover:underline">041-339-1844</a>)
          </p>
        </div>
      </footer>
    </>
  );
};

export default SafetyCheckForm; 