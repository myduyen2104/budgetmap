"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { MonthPicker } from "../../components/month-picker";
import { ErrorState, LoadingSkeleton, PageHeader } from "../../components/ui";
import { currentMonth } from "../../lib/movements";

type MapData = { month:string; daysInMonth:number; elapsedDays:number; remainingDays:number; actualIncome:string; actualExpense:string; projectedExpense:string; budgetedIncome:string; projectedCashFlow:string; walletTotal:string; dailyExpensePace:string; overspendPercentage:number|null; plannedSaving:string; savingProgress:string; goalDelayDays:number|null; transactions:{id:string;type:string;amount:string;date:string;description:string|null;category:string}[] };
type Simulation = { purchaseAmount:string; projectedCashBefore:string; projectedCashAfter:string; plannedSaving:string; goalDelayDays:number|null };
const money=(v:string|number)=>{const [n,d]=String(v).split(".");return `${n.replace(/\B(?=(\d{3})+(?!\d))/g,".")}${d&&d!=="00"?`,${d}`:""}`;};
const dateLabel=(v:string)=>new Intl.DateTimeFormat("vi-VN",{day:"numeric",month:"short"}).format(new Date(`${v}T00:00:00`));

export default function FinancialMap(){
 const [month,setMonth]=useState(currentMonth),[data,setData]=useState<MapData|null>(null),[amount,setAmount]=useState("15000000"),[simulation,setSimulation]=useState<Simulation|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[simError,setSimError]=useState("");
 const load=()=>{setLoading(true);setError("");api<MapData>(`/financial-map?month=${month}`).then(setData).catch(()=>setError("Không thể tải bản đồ tài chính.")).finally(()=>setLoading(false));};
 useEffect(load,[month]);
 const runSimulation=async()=>{setSimError("");setSimulation(null);try{setSimulation(await api<Simulation>("/financial-map/simulate",{method:"POST",body:JSON.stringify({month,amount})}));}catch{setSimError("Nhập số tiền hợp lệ để xem mô phỏng.");}};
 if(loading&&!data)return <main><LoadingSkeleton label="Đang dựng bản đồ tài chính…"/></main>;
 if(error||!data)return <main><ErrorState message={error||"Không có dữ liệu."} onRetry={load}/></main>;
 const safe=data.overspendPercentage===null||data.overspendPercentage<=0;
 return <main className="financial-map-page">
  <PageHeader title="Bản đồ tài chính" description="Nhìn trước dòng tiền cuối tháng và xem một quyết định hôm nay ảnh hưởng kế hoạch ra sao."/>
  <div className="financial-map-toolbar"><span className="eyebrow">KỲ THEO DÕI</span><MonthPicker value={month} onChange={setMonth}/></div>
  <section className={`financial-forecast card ${safe?"is-safe":"is-risk"}`} aria-live="polite">
   <div><p className="eyebrow">DỰ BÁO CUỐI THÁNG</p><h2>{safe?"Bạn đang đi đúng nhịp ngân sách.":`Theo nhịp hiện tại, chi tiêu có thể vượt ngân sách ${data.overspendPercentage}% .`}</h2><p>Ước tính dựa trên {data.elapsedDays} ngày đã qua và mức chi trung bình {money(data.dailyExpensePace)} mỗi ngày.</p></div>
   <div className="forecast-number"><span>Chi tiêu dự kiến</span><strong>{money(data.projectedExpense)}</strong><small>Ngân sách thu nhập {money(data.budgetedIncome)}</small></div>
  </section>
  <section className="financial-map-metrics"><article className="card"><span>Số dư các ví</span><strong>{money(data.walletTotal)}</strong></article><article className="card"><span>Dòng tiền dự kiến</span><strong className={Number(data.projectedCashFlow)<0?"expense":"income"}>{money(data.projectedCashFlow)}</strong></article><article className="card"><span>Tiến độ tiết kiệm</span><strong>{money(data.savingProgress)}</strong></article></section>
  <section className="card financial-timeline"><div className="section-heading"><div><h2>Dòng thời gian tháng {month}</h2><p className="muted">Các khoản thu chi đã ghi nhận theo ngày</p></div><a href="/transactions">Ghi giao dịch</a></div>
   {data.transactions.length===0?<p className="muted">Chưa có giao dịch trong tháng. Thêm giao dịch để bản đồ dự báo chính xác hơn.</p>:<ol>{data.transactions.map(t=><li key={t.id}><span className={`timeline-dot ${t.type=== "INCOME"?"income":"expense"}`}/><time>{dateLabel(t.date)}</time><span className="timeline-description">{t.description||t.category}</span><strong className={t.type==="INCOME"?"income":"expense"}>{t.type==="INCOME"?"+":"−"}{money(t.amount)}</strong></li>)}</ol>}
  </section>
  <section className="card what-if-card"><div><p className="eyebrow">WHAT IF?</p><h2>Một khoản mua lớn sẽ thay đổi kế hoạch thế nào?</h2><p className="muted">Thử số tiền dự định chi để xem dòng tiền và tiến độ tiết kiệm sau quyết định đó.</p><label htmlFor="what-if-amount">Số tiền dự định mua</label><div className="what-if-controls"><input id="what-if-amount" inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,""))}/><button type="button" onClick={runSimulation}>Mô phỏng</button></div>{simError&&<p role="alert" className="expense">{simError}</p>}</div>
   {simulation&&<div className="simulation-result" aria-live="polite"><span>Sau khoản mua {money(simulation.purchaseAmount)}</span><strong>{money(simulation.projectedCashAfter)}</strong><small>Dòng tiền dự kiến còn lại · trước đó {money(simulation.projectedCashBefore)}</small>{simulation.goalDelayDays===null?<p>Chưa đủ dữ liệu để ước tính thời gian đạt mục tiêu tiết kiệm.</p>:simulation.goalDelayDays===0?<p>Khoản mua này chưa làm chậm mục tiêu tiết kiệm tháng.</p>:<p>Mục tiêu tiết kiệm có thể chậm khoảng <b>{simulation.goalDelayDays} ngày</b> với nhịp hiện tại.</p>}<div className="goal-route"><span>Hiện tại</span><i/><b>Mục tiêu tiết kiệm</b></div></div>}
  </section>
 </main>;
}
