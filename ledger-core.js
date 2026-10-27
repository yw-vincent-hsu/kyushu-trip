/* 記帳共用計算：幣別換算（統一換成日圓）與分攤結算。index.html、ledger.html 共用 */
const LedgerCore={
  /* 單筆換算成日圓；cur 沒填的舊資料視為日圓 */
  jpy(r,rate){return r.cur==='TWD'?r.amt/rate:r.amt;},
  /* 這筆要分攤的人；share 沒填代表全員 */
  sharers(r,names){const s=String(r.share||'').split(',').map(x=>x.trim()).filter(Boolean);return s.length?s:names;},
  /* 回傳 {tot, names, rows:[{name,paid,owed}], lines:[{from,to,amt}]}（金額皆為日圓） */
  summary(all,mem,rate){
    const names=[...new Set([...mem,...all.flatMap(r=>[r.payer,...String(r.share||'').split(',').map(x=>x.trim())]).filter(Boolean)])];
    const paid={},owed={};names.forEach(n=>{paid[n]=0;owed[n]=0;});
    let tot=0;
    all.forEach(r=>{
      const j=LedgerCore.jpy(r,rate),sh=LedgerCore.sharers(r,names);
      tot+=j;
      if(r.payer&&r.payer in paid)paid[r.payer]+=j;
      sh.forEach(n=>{owed[n]+=j/sh.length;});
    });
    const rows=names.map(name=>({name,paid:paid[name],owed:owed[name]}));
    const cr=rows.map(x=>[x.name,x.paid-x.owed]).filter(x=>x[1]>0.5).sort((a,b)=>b[1]-a[1]);
    const db=rows.map(x=>[x.name,x.owed-x.paid]).filter(x=>x[1]>0.5).sort((a,b)=>b[1]-a[1]);
    const lines=[];let i=0,j=0;
    while(i<db.length&&j<cr.length){
      const m=Math.min(db[i][1],cr[j][1]);
      lines.push({from:db[i][0],to:cr[j][0],amt:m});
      db[i][1]-=m;cr[j][1]-=m;
      if(db[i][1]<0.5)i++;if(cr[j][1]<0.5)j++;
    }
    return {tot,names,rows,lines};
  }
};
