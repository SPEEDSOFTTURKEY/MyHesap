import{r as i,j as e,C as K,a as A,b as z,c as H,ap as T,e as U,f as q,g as G,s as O,q as g,m as P,M as _,h as Q,N as W,Q as Y,S as J,i as V,T as X,U as Z,o as ee,W as ae,t as y}from"./index-DAwD_DDx.js";const re=()=>{var $;const[x,v]=i.useState({urunMarka:[],urunKategori:[],urunRaf:[],musteriSinif1:[],musteriSinif2:[],tedarikciSinif1:[],tedarikciSinif2:[],fihristGrup1:[],fihristGrup2:[]}),[t,F]=i.useState(null),[m,S]=i.useState(""),[E,c]=i.useState(!1),[p,f]=i.useState({adi:""}),[h,d]=i.useState(!1),[k,l]=i.useState(null),B=i.useRef(),C="https://speedsofttest.com/api",b=[{key:"urunMarka",label:"Ürün Markaları",endpoint:`${C}/urunMarka`},{key:"urunKategori",label:"Ürün Kategorileri",endpoint:`${C}/urunKategori`},{key:"urunRaf",label:"Raf Yerleri",endpoint:`${C}/urunRaf`}],j=async a=>{var o;d(!0);try{const s=await y.get(`${a.endpoint}/get-all`);v(r=>({...r,[a.key]:s.data.filter(u=>u.durumu===1)}))}catch(s){console.error(`${a.label} çekilirken hata:`,((o=s.response)==null?void 0:o.data)||s.message),l({message:`${a.label} yüklenirken hata oluştu.`,color:"danger"})}finally{d(!1)}};i.useEffect(()=>{b.forEach(a=>j(a))},[]);const M=(a,o,s)=>x[o].some(r=>r.adi.toLowerCase()===a.toLowerCase()&&r.id!==s),N=(a,o)=>{F(a),S(o),f({adi:a.adi}),c(!0)},L=a=>{F(null),S(a),f({adi:""}),c(!0)},I=a=>{const{name:o,value:s}=a.target;f(r=>({...r,[o]:s}))},R=async a=>{var r,u,w;a.preventDefault(),d(!0);const o=b.find(n=>n.key===m),s=t==null?void 0:t.id;if(M(p.adi,m,s)){l({message:`Bu isimde bir ${o.label.toLowerCase()} zaten mevcut!`,color:"danger"}),d(!1);return}try{const n={id:(t==null?void 0:t.id)||0,adi:p.adi,eklenmeTarihi:new Date().toISOString(),guncellenmeTarihi:new Date().toISOString(),durumu:1};t!=null&&t.id?(await y.put(`${o.endpoint}/update`,n,{headers:{"Content-Type":"application/json",accept:"*/*"}}),l({message:`${p.adi} ${o.label.toLowerCase()} başarıyla güncellendi.`,color:"success"})):(await y.post(`${o.endpoint}/create`,n,{headers:{"Content-Type":"application/json",accept:"*/*"}}),l({message:`${p.adi} ${o.label.toLowerCase()} başarıyla eklendi.`,color:"success"})),await j(o),c(!1),f({adi:""})}catch(n){console.error(`${o.label} kaydedilirken hata:`,((r=n.response)==null?void 0:r.data)||n.message),l({message:`${o.label} kaydedilirken hata: ${((w=(u=n.response)==null?void 0:u.data)==null?void 0:w.title)||n.message}`,color:"danger"})}finally{d(!1)}},D=async()=>{var a,o,s;d(!0);try{const r=b.find(u=>u.key===m);await y.delete(`${r.endpoint}/delete/${t.id}`,{headers:{accept:"*/*"}}),await j(r),l({message:`${t.adi} ${r.label.toLowerCase()} silindi.`,color:"success"}),c(!1)}catch(r){console.error(`${m} silinirken hata:`,((a=r.response)==null?void 0:a.data)||r.message),l({message:`${config.label} silinirken hata: ${((s=(o=r.response)==null?void 0:o.data)==null?void 0:s.title)||r.message}`,color:"danger"})}finally{d(!1)}};return e.jsxs(e.Fragment,{children:[e.jsx(K,{ref:B,placement:"top-end",className:"p-3",children:k&&e.jsxs(A,{autohide:5e3,visible:!!k,color:k.color,className:"text-white shadow-lg",onClose:()=>l(null),children:[e.jsx(z,{closeButton:{label:"Kapat"},children:e.jsx("strong",{className:"me-auto",children:"Bildirim"})}),e.jsx(H,{children:k.message})]})}),h&&e.jsx(T,{color:"primary"}),e.jsx("style",{children:`
          @media (prefers-color-scheme: dark) {
            .definition-card-body {
              background-color: var(--cui-light) !important;
              color: var(--cui-body-color-dark) !important;
            }
            .definition-header {
              background-color: #2965A8 !important;
              color: #FFFFFF !important;
            }
            .add-button {
              background-color: #E88B22 !important;
              color: #FFFFFF !important;
              border: none !important;
            }
            .add-button:hover {
              background-color: #EB9E3E !important;
            }
            .edit-button:hover {
              background-color: rgba(255, 255, 255, 0.2) !important;
            }
          }
          @media (prefers-color-scheme: light) {
            .definition-card-body {
              background-color: var(--cui-light) !important;
              color: var(--cui-body-color) !important;
            }
            .definition-header {
              background-color: #2965A8 !important;
              color: #FFFFFF !important;
            }
            .add-button {
              background-color: #E88B22 !important;
              color: #333333 !important;
              border: none !important;
            }
            .add-button:hover {
              background-color: #EB9E3E !important;
            }
            .edit-button:hover {
              background-color: rgba(255, 255, 255, 0.2) !important;
            }
          }
        `}),e.jsx(U,{xs:{gutter:5},children:b.map(a=>e.jsx(q,{sm:6,xl:6,xxl:6,children:e.jsxs(G,{children:[e.jsxs(O,{className:"definition-header",children:[a.label.toUpperCase(),e.jsxs(g,{color:"warning",size:"sm",className:"float-end add-button",onClick:()=>L(a.key),children:[e.jsx(P,{icon:_,size:"sm"})," Ekle"]})]}),e.jsx(Q,{className:"definition-card-body",children:e.jsxs("div",{className:"d-flex flex-wrap gap-2",children:[x[a.key].map(o=>e.jsx(g,{color:"info",size:"sm",className:"text-start px-2 py-1",onClick:()=>N(o,a.key),children:o.adi},o.id)),x[a.key].length===0&&e.jsx("p",{className:"text-muted",children:"Kayıt bulunamadı."})]})})]})},a.key))}),e.jsxs(W,{visible:E,backdrop:"static",keyboard:!1,onClose:()=>c(!1),children:[e.jsx(Y,{children:e.jsx(J,{children:(($=b.find(a=>a.key===m))==null?void 0:$.label)||"Tanım"})}),e.jsxs(V,{onSubmit:R,children:[e.jsxs(X,{children:[e.jsx(Z,{htmlFor:"adi",children:"Tanım Adı"}),e.jsx(ee,{id:"adi",name:"adi",value:p.adi,onChange:I,placeholder:"Tanım adını girin",required:!0})]}),e.jsxs(ae,{children:[(t==null?void 0:t.id)&&e.jsx(g,{color:"danger",style:{color:"white"},onClick:D,disabled:h,children:"Sil"}),e.jsx(g,{type:"submit",color:"primary",disabled:h,children:h?e.jsx(T,{size:"sm"}):"Kaydet"}),e.jsx(g,{color:"secondary",onClick:()=>c(!1),disabled:h,children:"İptal"})]})]})]})]})};export{re as default};
