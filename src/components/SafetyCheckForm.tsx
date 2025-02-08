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
  <div className="form-group">
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

  const filteredChecklistItems = useMemo(() => {
    // 공사 여건이 하나도 선택되지 않은 경우 모든 항목 반환
    if (!formData.constructionStatus && !formData.constructionCost && 
        !formData.hasSpecialConstruction1 && !formData.hasSpecialConstruction2) {
      return CHECKLIST_ITEMS;
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

    // 공사 여건 관련 필드가 변경될 때
    if (['constructionStatus', 'constructionCost', 'hasSpecialConstruction1', 'hasSpecialConstruction2'].includes(name)) {
      // 모든 공사 여건이 선택되었는지 확인
      const updatedFormData = {
        ...formData,
        [name]: value
      };
      
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
    const currentChecklistItems = Object.keys(filteredChecklistItems);
    return currentChecklistItems.length > 0 &&
           currentChecklistItems.every(item => formData.checklistItems[item]);
  }, [filteredChecklistItems, formData.checklistItems]);

  // 체크리스트가 완료되면 자동으로 섹션을 접고 점검자 정보 섹션을 펼침
  useEffect(() => {
    if (isChecklistComplete) {
      setIsChecklistSectionCollapsed(true);
      setIsInspectorSectionCollapsed(false);
      // 점검자 정보 섹션으로 부드럽게 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context creation failed');
      }

      canvas.width = 2480; // A4 width at 300 DPI
      canvas.height = 3508; // A4 height at 300 DPI
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      ctx.textBaseline = 'middle';

      // 로고 이미지 추가
      const logoImg = new Image();
      logoImg.src = '/KRCPNG.png';
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        setTimeout(reject, 5000);
      });

      // 로고와 제목 배치
      const logoWidth = 200;
      const logoHeight = (logoWidth * logoImg.height) / logoImg.width;
      ctx.drawImage(logoImg, 200, 150, logoWidth, logoHeight);

      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('안전서류 점검 결과', 450, 200);

      // 안산방조제 텍스트 추가
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[안산방조제]', canvas.width / 2, 300);

      // 텍스트 너비 측정 함수 추가
      const measureTextWidth = (text: string, font: string) => {
        ctx.font = font;
        return ctx.measureText(text).width;
      };

      // 테이블 데이터의 최대 텍스트 너비 계산 함수
      const calculateTableWidth = (rows: Array<[string, string]>, padding: number = 60) => {
        let maxLabelWidth = 0;
        let maxValueWidth = 0;
        
        rows.forEach(([label, value]) => {
          const labelWidth = measureTextWidth(`• ${label}`, '45px sans-serif');
          const valueWidth = measureTextWidth(`: ${value}`, '45px sans-serif');
          maxLabelWidth = Math.max(maxLabelWidth, labelWidth);
          maxValueWidth = Math.max(maxValueWidth, valueWidth);
        });

        return maxLabelWidth + maxValueWidth + padding * 3; // 여유 공간 포함
      };

      // 공사 여건과 점검자 정보 데이터 준비
      const constructionData: Array<[string, string]> = [
        ['공사 상태', formData.constructionStatus],
        ['총공사비 규모', formData.constructionCost],
        ['유해위험방지계획서', formData.hasSpecialConstruction1],
        ['안전관리계획서', formData.hasSpecialConstruction2]
      ];

      const inspectorData: Array<[string, string]> = [
        ['본부', formData.headquarters],
        ['지사', formData.branch],
        ['점검자 소속', formData.inspectorAffiliation],
        ['점검자명', formData.inspectorName],
        ['점검일자', formData.inspectionDate]
      ];

      // 각 테이블의 필요 너비 계산
      const constructionTableWidth = calculateTableWidth(constructionData);
      const inspectorTableWidth = calculateTableWidth(inspectorData);

      // 테이블 간 간격 설정
      const gap = 50;
      const totalWidth = constructionTableWidth + inspectorTableWidth + gap;
      const startX = 200; // 좌측 여백 200으로 고정

      // 공사 여건 테이블 그리기
      let currentY = 400;
      const drawTable = (x: number, y: number, title: string, rows: Array<[string, string]>, options: {
        width?: number;
        isChecklist?: boolean;
      } = {}) => {
        const tableWidth = options.width || 1000;
        const rowHeight = 80;
        const cellPadding = 30;
        
        // 제목이 있을 때만 제목을 그리고 간격을 추가
        if (title) {
          ctx.font = 'bold 50px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#000000';
          ctx.fillText(`■ ${title}`, x, y);
          y += 80; // 제목과 테이블 사이 간격
        }

        rows.forEach(([label, value], index) => {
          // 배경색 설정
          ctx.fillStyle = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
          ctx.fillRect(x, y, tableWidth, rowHeight);
          
          // 테두리
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, tableWidth, rowHeight);
          
          // 텍스트 스타일
          ctx.fillStyle = options.isChecklist && value === '불이행' ? '#ff0000' : '#000000';
          ctx.font = '45px sans-serif';
          ctx.textAlign = 'left';
          
          // 레이블과 값 배치
          const labelX = x + cellPadding;
          const valueX = x + tableWidth * 0.6; // 값은 테이블 너비의 60% 지점에서 시작
          
          ctx.fillText(`• ${label}`, labelX, y + rowHeight/2);
          ctx.fillText(`: ${value}`, valueX, y + rowHeight/2);
          
          y += rowHeight;
        });
        
        return y + 30; // 다음 테이블과의 간격
      };

      drawTable(startX, currentY, '공사 여건', constructionData, {
        width: constructionTableWidth
      });

      // 점검자 정보 테이블 그리기
      drawTable(startX + constructionTableWidth + gap, currentY, '점검자 정보', inspectorData, {
        width: inspectorTableWidth
      });

      // 체크리스트 결과 섹션 (간격 증가)
      currentY += 700; // 간격을 더 넓게 조정

      // 체크리스트 결과 제목과 요약 정보를 포함하는 컨테이너 생성
      const checklistTitle = '■ 체크리스트 결과';
      const titleWidth = measureTextWidth(checklistTitle, 'bold 50px sans-serif');

      // 요약 정보 준비
      const counts = Object.values(formData.checklistItems).reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {} as Record<CheckOption, number>);

      const summaryText = `(이행: ${counts['이행'] || 0}건, 불이행: ${counts['불이행'] || 0}건, 해당없음: ${counts['해당없음'] || 0}건)`;
      const summaryWidth = measureTextWidth(summaryText, '40px sans-serif');

      // 제목과 요약 정보 배치
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      ctx.fillText(checklistTitle, 200, currentY);

      ctx.font = '40px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText(summaryText, 200 + titleWidth + 40, currentY);

      // 체크리스트 항목 테이블 그리기
      const checklistData: Array<[string, CheckOption]> = Object.entries(formData.checklistItems).map(([item, value], index) => [
        `${index + 1}. ${item}`,
        value
      ]);

      drawTable(200, currentY + 80, '', checklistData, {
        width: canvas.width - 400,
        isChecklist: true
      });

      // 페이지 나누기 처리
      if (currentY > canvas.height - 100) {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(dataUrl, 'JPEG', 0, 0, 210, 297);
        doc.addPage();
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        currentY = 100;
      }

      // PDF 저장
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(dataUrl, 'JPEG', 0, 0, 210, 297);
      doc.save(`안전서류_점검결과_${formData.projectName}.pdf`);
    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  const handleSubmit = () => {
    // 추후 백엔드 구현 시 활성화
    alert('제출 기능은 현재 준비 중입니다.');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
            <img src="/KRCPNG.png" alt="한국농어촌공사 로고" className="h-8 w-auto" />
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[var(--apple-text)] text-center">
              한국농어촌공사 안전서류 점검시스템
            </h1>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="메뉴 열기"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container pt-24">
        {isConstructionSettingsComplete && isChecklistComplete && isInspectorInfoComplete && (
          <div className="sticky top-0 z-50 bg-white py-4 border-b border-gray-200 mb-6 animate-fade-in">
            <div className="flex justify-center gap-4">
              <button
                onClick={generatePDF}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                점검보고서 저장하기(PDF)
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
              >
                제출하기
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
                    {Object.keys(filteredChecklistItems).map((item, index) => (
                      <div 
                        key={item} 
                        className={`mb-4 last:mb-0 p-4 rounded-lg ${
                          index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-50'
                        }`}
                      >
                        <label className="block mb-2 font-medium">{item}</label>
                        <div className="radio-group">
                          {CHECK_OPTIONS.map((option: CheckOption) => (
                            <label key={option} className="radio-label">
                              <input
                                type="radio"
                                name={`checklistItems.${item}`}
                                value={option}
                                checked={formData.checklistItems[item] === option}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    checklistItems: {
                                      ...prev.checklistItems,
                                      [item]: e.target.value as CheckOption
                                    }
                                  }));
                                  
                                  // 현재 선택한 항목의 다음 항목을 찾습니다
                                  const checklistItems = Object.keys(filteredChecklistItems);
                                  const currentIndex = checklistItems.indexOf(item);
                                  const nextItem = checklistItems[currentIndex + 1];
                                  
                                  // 다음 항목이 있다면 해당 항목으로 스크롤합니다
                                  if (nextItem) {
                                    setTimeout(() => {
                                      const nextElement = document.querySelector(`[name="checklistItems.${nextItem}"]`);
                                      if (nextElement) {
                                        nextElement.parentElement?.parentElement?.parentElement?.scrollIntoView({
                                          behavior: 'smooth',
                                          block: 'center'
                                        });
                                      }
                                    }, 100);
                                  }
                                }}
                              />
                              {option}
                            </label>
                          ))}
                        </div>
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
                    const totalItems = Object.keys(formData.checklistItems).length;
                    const counts = Object.values(formData.checklistItems).reduce((acc, curr) => {
                      acc[curr] = (acc[curr] || 0) + 1;
                      return acc;
                    }, {} as Record<CheckOption, number>);

                    return (
                      <>
                        총 체크리스트 항목: {totalItems}개<br />
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
              <div className="form-group">
                <label>점검 대상 사업명</label>
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

              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label>본부</label>
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
                  <label>지사</label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="select-control"
                    disabled={!formData.headquarters}
                  >
                    <option value="">선택하세요</option>
                    {formData.headquarters && BRANCH_OFFICES[formData.headquarters].map((branch: Branch) => (
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
                    onKeyDown={handleInspectorKeyDown}
                    className="select-control placeholder-gray-400"
                    placeholder="예) 4급 홍길동"
                  />
                </div>
              </div>

              <div className="form-group">
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