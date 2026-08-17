'use client';

import React, { useState, useEffect } from 'react';
import { Download, ChevronRight, Eye, ChevronLeft, Search, FileText, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

export default function DetailRiwayatClient({ 
  kelasName, 
  schoolName, 
  students, 
  semester, 
  maxLitTasks, 
  maxNumTasks, 
  litTaskTitles, 
  numTaskTitles 
}) {
  const [litPage, setLitPage] = useState(1);
  const [numPage, setNumPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const [selectedStudentTasks, setSelectedStudentTasks] = useState(null);

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: `Riwayat Lino > Detail Kelas` });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, []);

  const totalLitPages = Math.ceil(students.length / itemsPerPage);
  const totalNumPages = Math.ceil(students.length / itemsPerPage);
  const paginatedLitStudents = students.slice((litPage - 1) * itemsPerPage, litPage * itemsPerPage);
  const paginatedNumStudents = students.slice((numPage - 1) * itemsPerPage, numPage * itemsPerPage);

  const confirmExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 66, 130);
    doc.text(`Riwayat Lino: Kelas ${kelasName}`, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(semester ? `Semester ${semester.jenis} ${semester.tahunAjaran}` : '', 14, 28);
    
    let tableData = students.map((s, idx) => [
      idx + 1, s.name, s.nis, s.avgLit, s.avgNum
    ]);

    if (tableData.length === 0) {
      doc.text("Tidak ada data.", 14, 40);
    } else {
      doc.autoTable({
          head: [['No', 'Nama Siswa', 'NIS', 'Rata-Rata Literasi', 'Rata-Rata Numerasi']],
          body: tableData,
          startY: 35,
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [0, 66, 130] }
      });
    }
    
    doc.save(`Riwayat_Lino_Kelas_${kelasName.replace(/ /g, '_')}.pdf`);
    setShowExportModal(false);
  };

  const getProgressColor = (score) => {
    const num = parseFloat(score);
    if (isNaN(num)) return '#d1d5db';
    if (num >= 75) return '#059669';
    if (num >= 60) return '#d97706';
    return '#dc2626';
  };

  let totalLitSum = 0, litCount = 0;
  let totalNumSum = 0, numCount = 0;
  let totalLitCompleted = 0, totalNumCompleted = 0;
  
  students.forEach(s => {
    totalLitCompleted += s.litTaskCount;
    totalNumCompleted += s.numTaskCount;
    if (s.avgLit !== '-') { totalLitSum += parseFloat(s.avgLit); litCount++; }
    if (s.avgNum !== '-') { totalNumSum += parseFloat(s.avgNum); numCount++; }
  });

  const avgClassLitScore = litCount > 0 ? (totalLitSum / litCount).toFixed(1) : 0;
  const avgClassNumScore = numCount > 0 ? (totalNumSum / numCount).toFixed(1) : 0;
  
  const possibleLitTasks = students.length * maxLitTasks;
  const possibleNumTasks = students.length * maxNumTasks;
  const litCompletionRate = possibleLitTasks > 0 ? Math.round((totalLitCompleted / possibleLitTasks) * 100) : 0;
  const numParticipationRate = possibleNumTasks > 0 ? Math.round((totalNumCompleted / possibleNumTasks) * 100) : 0;

  const numerasiChartData = numTaskTitles.map((title, idx) => {
    let sum = 0, c = 0;
    students.forEach(s => {
      const t = s.numTasks.find(x => x.title === title);
      if (t && t.score !== null) { sum += t.score; c++; }
    });
    return { name: `N${idx+1}`, score: c > 0 ? sum/c : 0 };
  });

  const literasiChartData = [
    { name: 'T1', val: litCompletionRate > 20 ? litCompletionRate - 20 : 0 },
    { name: 'T2', val: litCompletionRate > 10 ? litCompletionRate - 10 : 0 },
    { name: 'T3', val: litCompletionRate > 5 ? litCompletionRate - 5 : 0 },
    { name: 'T4', val: litCompletionRate },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/guru/riwayat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}>
            <ArrowLeft size={20} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 700 }}>
              Detail Riwayat: Kelas {kelasName} {semester ? `(${semester.tahunAjaran})` : ''}
            </h1>
            {semester && !semester.isActive && (
              <span style={{ backgroundColor: '#e5e7eb', color: '#4b5563', padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
                Archived
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          className="hover-btn"
          style={{ 
            backgroundColor: '#004282', color: 'white', padding: '10px 20px', 
            borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Download size={18} /> Export Data Lino Kelas
        </button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Literasi Card */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #14b8a6', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: 700, fontSize: '1.25rem', marginBottom: '4px' }}>
                <FileText size={20} color="#059669" /> Diagnostic: Literasi
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Aggregate performance overview</div>
            </div>
            {litCompletionRate >= 80 && (
              <span style={{ backgroundColor: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>High Completion</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em', marginBottom: '8px' }}>COMPLETION RATE</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{litCompletionRate}%</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em', marginBottom: '8px' }}>TOTAL TASKS AVG</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  {students.length > 0 ? Math.round(totalLitCompleted / students.length) : 0} / {maxLitTasks}
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1, height: '140px', position: 'relative' }}>
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={literasiChartData}>
                   <Line type="monotone" dataKey="val" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} />
                 </LineChart>
               </ResponsiveContainer>
               <div style={{ position: 'absolute', bottom: 0, right: 0, fontSize: '0.65rem', color: '#9ca3af' }}>Timeline</div>
               <div style={{ position: 'absolute', bottom: '50%', left: '-20px', fontSize: '0.65rem', color: '#9ca3af', transform: 'rotate(-90deg)' }}>Completion %</div>
            </div>
          </div>
        </div>

        {/* Numerasi Card */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #d97706', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: 700, fontSize: '1.25rem', marginBottom: '4px' }}>
                <FileText size={20} color="#d97706" /> Diagnostic: Numerasi
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Aggregate performance overview</div>
            </div>
            {avgClassNumScore < 60 && (
              <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Needs Attention</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em', marginBottom: '8px' }}>AVERAGE SCORE</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{avgClassNumScore}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em', marginBottom: '8px' }}>PARTICIPATION RATE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                  {numParticipationRate}%
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1, height: '140px', position: 'relative' }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={numerasiChartData}>
                   <Tooltip cursor={{fill: '#f3f4f6'}} />
                   <Bar dataKey="score" fill="#d97706" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
               <div style={{ position: 'absolute', bottom: 0, right: 0, fontSize: '0.65rem', color: '#9ca3af' }}>Assessments</div>
               <div style={{ position: 'absolute', bottom: '50%', left: '-10px', fontSize: '0.65rem', color: '#9ca3af', transform: 'rotate(-90deg)' }}>Avg Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Literasi */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '32px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#111827', fontWeight: 700 }}>Tabel Literasi</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.875rem', fontWeight: 600 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }}></div> Class Data
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>No</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Nama Siswa</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>NIS</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Tugas Selesai</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Progres (%)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLitStudents.map((s, idx) => {
                const percentage = maxLitTasks > 0 ? Math.round((s.litTaskCount / maxLitTasks) * 100) : 0;
                const color = getProgressColor(percentage);
                return (
                  <tr key={s.id} onClick={() => setSelectedStudentTasks({ type: 'literasi', student: s })} style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 24px', color: '#4b5563' }}>{(litPage - 1) * itemsPerPage + idx + 1}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#111827' }}>{s.name}</td>
                    <td style={{ padding: '16px 24px', color: '#6b7280' }}>{s.nis}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '16px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                        {s.litTaskCount}/{maxLitTasks}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', width: '100px' }}>
                          <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: '3px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Literasi */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Showing {(litPage - 1) * itemsPerPage + 1}-{Math.min(litPage * itemsPerPage, students.length)} of {students.length} records
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={litPage === 1} onClick={() => setLitPage(p => p - 1)} style={{ padding: '6px 10px', border: 'none', background: 'none', cursor: litPage === 1 ? 'not-allowed' : 'pointer', color: '#4b5563' }}>&lt;</button>
            {[...Array(totalLitPages)].map((_, i) => (
              <button key={i} onClick={() => setLitPage(i + 1)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', backgroundColor: litPage === i + 1 ? '#004282' : 'transparent', color: litPage === i + 1 ? 'white' : '#4b5563', fontWeight: litPage === i + 1 ? 600 : 400, cursor: 'pointer' }}>{i + 1}</button>
            ))}
            <button disabled={litPage === totalLitPages} onClick={() => setLitPage(p => p + 1)} style={{ padding: '6px 10px', border: 'none', background: 'none', cursor: litPage === totalLitPages ? 'not-allowed' : 'pointer', color: '#4b5563' }}>&gt;</button>
          </div>
        </div>
      </div>

      {/* Tabel Numerasi */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#111827', fontWeight: 700 }}>Tabel Numerasi</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontSize: '0.875rem', fontWeight: 600 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }}></div> Assessment Log
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>No</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Nama Siswa</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>NIS</th>
                {numTaskTitles.map((title, idx) => (
                  <th key={idx} style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>N{idx + 1}</th>
                ))}
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {paginatedNumStudents.map((s, idx) => {
                return (
                  <tr key={s.id} onClick={() => setSelectedStudentTasks({ type: 'numerasi', student: s })} style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 24px', color: '#4b5563' }}>{(numPage - 1) * itemsPerPage + idx + 1}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#111827' }}>{s.name}</td>
                    <td style={{ padding: '16px 24px', color: '#6b7280' }}>{s.nis}</td>
                    {numTaskTitles.map((title, tIdx) => {
                      const task = s.numTasks.find(x => x.title === title);
                      const score = task && task.score !== null ? task.score : '-';
                      const color = score !== '-' ? getProgressColor(score) : '#6b7280';
                      return (
                        <td key={tIdx} style={{ padding: '16px 24px', textAlign: 'center', color: color, fontWeight: 500 }}>
                          {score}
                        </td>
                      );
                    })}
                    <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, color: getProgressColor(s.avgNum) }}>
                      {s.avgNum}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Numerasi */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Showing {(numPage - 1) * itemsPerPage + 1}-{Math.min(numPage * itemsPerPage, students.length)} of {students.length} records
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={numPage === 1} onClick={() => setNumPage(p => p - 1)} style={{ padding: '6px 10px', border: 'none', background: 'none', cursor: numPage === 1 ? 'not-allowed' : 'pointer', color: '#4b5563' }}>&lt;</button>
            {[...Array(totalNumPages)].map((_, i) => (
              <button key={i} onClick={() => setNumPage(i + 1)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', backgroundColor: numPage === i + 1 ? '#004282' : 'transparent', color: numPage === i + 1 ? 'white' : '#4b5563', fontWeight: numPage === i + 1 ? 600 : 400, cursor: 'pointer' }}>{i + 1}</button>
            ))}
            <button disabled={numPage === totalNumPages} onClick={() => setNumPage(p => p + 1)} style={{ padding: '6px 10px', border: 'none', background: 'none', cursor: numPage === totalNumPages ? 'not-allowed' : 'pointer', color: '#4b5563' }}>&gt;</button>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>Export Data Lino Kelas</h2>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Dari Tanggal (Opsional)</label>
              <input 
                type="date" 
                value={exportStartDate}
                onChange={e => setExportStartDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Sampai Tanggal (Opsional)</label>
              <input 
                type="date" 
                value={exportEndDate}
                onChange={e => setExportEndDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              />
            </div>

            <button 
              onClick={confirmExport}
              style={{ width: '100%', padding: '12px', backgroundColor: '#004282', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Export PDF
            </button>
          </div>
        </div>
      )}

      {/* Task List Modal */}
      {selectedStudentTasks && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                  Detail Riwayat {selectedStudentTasks.type === 'literasi' ? 'Literasi' : 'Numerasi'}
                </h2>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                  {selectedStudentTasks.student.name} ({selectedStudentTasks.student.nis})
                </div>
              </div>
              <button onClick={() => setSelectedStudentTasks(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Topik / Tugas</th>
                    {selectedStudentTasks.type === 'numerasi' && (
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Skor</th>
                    )}
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>File</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedStudentTasks.type === 'literasi' ? selectedStudentTasks.student.litTasks : selectedStudentTasks.student.numTasks).map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', color: '#111827', fontSize: '0.875rem', fontWeight: 500 }}>
                        {t.title}
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                          {new Date(t.date).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      {selectedStudentTasks.type === 'numerasi' && (
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: t.score !== null ? getProgressColor(t.score) : '#9ca3af', fontWeight: 600 }}>
                          {t.score !== null ? t.score : '-'}
                        </td>
                      )}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {t.fileUrl ? (
                          <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', padding: '6px 12px', backgroundColor: '#eff6ff', color: '#004282', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>
                            Buka File
                          </a>
                        ) : (
                          <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>Tidak ada file</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(selectedStudentTasks.type === 'literasi' ? selectedStudentTasks.student.litTasks : selectedStudentTasks.student.numTasks).length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                        Belum ada tugas di semester ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
