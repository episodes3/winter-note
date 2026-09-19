let sb=null,user=null,currentPage="home",currentChannel="",notes=[],schedules=[],ideas=[],todos=[],currentNote=null,weekOffset=0,saveTimer=null,ideaStatus="active",ideaCategory="전체";
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const channelMap={hyeyoung:"혜영이는 못말려",woojae:"오늘의 주우재",dowoon:"윤도운도윤"};
const channelEmoji={"혜영이는 못말려":"👗","오늘의 주우재":"🦴","윤도운도윤":"🐶","기타":"•"};
const esc=s=>(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const strip=s=>{let d=document.createElement("div");d.innerHTML=s||"";return d.textContent||""};
function toast(t){let el=$("#toast");el.classList.remove("action-toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800)}
function undoToast(message,onUndo,duration=4000){let el=$("#toast");el.innerHTML=`<span>${esc(message)}</span><button type="button">되돌리기</button>`;el.classList.add("show","action-toast");let undone=false;let timer=setTimeout(()=>{el.classList.remove("show","action-toast");el.textContent=""},duration);el.querySelector("button").onclick=()=>{if(undone)return;undone=true;clearTimeout(timer);el.classList.remove("show","action-toast");el.textContent="";onUndo()};return()=>undone}
function localDate(d=new Date()){let x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)}
function fmtDate(v){if(!v)return"";let d=new Date(v);return `${d.getMonth()+1}.${d.getDate()}`}
function initClient(){
  const url=localStorage.getItem("wn_supabase_url"),key=localStorage.getItem("wn_supabase_key");
  if(!url||!key){$("#setupScreen").classList.remove("hidden");return false}
  try{sb=supabase.createClient(url,key);return true}catch(e){$("#setupScreen").classList.remove("hidden");return false}
}
$("#saveSetup").onclick=()=>{
  let u=$("#setupUrl").value.trim(),k=$("#setupKey").value.trim();
  if(!u||!k)return toast("URL과 키를 모두 입력해 주세요.");
  localStorage.setItem("wn_supabase_url",u);localStorage.setItem("wn_supabase_key",k);location.reload();
};
$("#backSetup").onclick=()=>{localStorage.removeItem("wn_supabase_url");localStorage.removeItem("wn_supabase_key");location.reload()};
async function boot(){
  if(!initClient())return;
  const {data:{session}}=await sb.auth.getSession();
  if(!session){$("#loginScreen").classList.remove("hidden");return}
  user=session.user;showApp();await loadAll();
  sb.auth.onAuthStateChange((_e,s)=>{if(!s)location.reload()});
}
$("#loginBtn").onclick=async()=>{
  $("#loginError").textContent="";
  const {data,error}=await sb.auth.signInWithPassword({email:$("#loginEmail").value.trim(),password:$("#loginPassword").value});
  if(error){$("#loginError").textContent="로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요.";return}
  user=data.user;$("#loginScreen").classList.add("hidden");showApp();await loadAll();
};
$("#loginPassword").addEventListener("keydown",e=>{if(e.key==="Enter")$("#loginBtn").click()});
$("#logoutBtn").onclick=async()=>{await sb.auth.signOut();location.reload()};
function showApp(){
  $("#app").classList.remove("hidden");$("#userEmail").textContent=user.email||"";
  const d=new Date();$("#todayText").textContent=new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"short"}).format(d);
}
async function loadAll(){await Promise.all([loadNotes(),loadSchedules(),loadIdeas(),loadTodos()]);renderHome()}
async function loadTodos(){
  const {data,error}=await sb.from("todos").select("*").eq("todo_date",localDate()).order("created_at",{ascending:true});
  if(!error)todos=data||[];
}
async function loadIdeas(){
  const {data,error}=await sb.from("ideas").select("*").order("updated_at",{ascending:false});
  if(!error)ideas=data||[];
}
async function loadNotes(){
  const {data,error}=await sb.from("notes").select("*").order("is_pinned",{ascending:false}).order("updated_at",{ascending:false});
  if(!error)notes=data||[];
}
async function loadSchedules(){
  const {data,error}=await sb.from("schedules").select("*").order("schedule_date",{ascending:true});
  if(!error)schedules=data||[];
}
$$(".nav-item").forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
function switchPage(p){
  currentPage=p;$$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
  $("#homePage").classList.add("hidden");$("#notesPage").classList.add("hidden");$("#ideasPage").classList.add("hidden");
  if(p==="home"){
    $("#homePage").classList.remove("hidden");$("#pageTitle").textContent="홈";$("#eyebrow").textContent="PERSONAL DASHBOARD";renderHome();
  }else if(p==="ideas"){
    $("#ideasPage").classList.remove("hidden");$("#pageTitle").textContent="아이디어 보관함";$("#eyebrow").textContent="IDEA ARCHIVE";renderIdeas();
  }else{
    currentChannel=channelMap[p];$("#notesPage").classList.remove("hidden");
    $("#pageTitle").textContent=currentChannel;$("#eyebrow").textContent="CHANNEL NOTES";currentNote=null;showEmptyEditor();renderNoteList();
  }
}
function weekStart(){
  let d=new Date(),day=d.getDay(),diff=(day===0?-6:1-day);d.setHours(0,0,0,0);d.setDate(d.getDate()+diff+(weekOffset*7));return d;
}
function renderHome(){renderWeek();renderTodos();renderRecent()}
function renderWeek(){
  let s=weekStart(),e=new Date(s);e.setDate(e.getDate()+6);
  $("#weekRange").textContent=`${s.getFullYear()}.${String(s.getMonth()+1).padStart(2,"0")}.${String(s.getDate()).padStart(2,"0")} — ${e.getFullYear()}.${String(e.getMonth()+1).padStart(2,"0")}.${String(e.getDate()).padStart(2,"0")}`;
  const names=["월","화","수","목","금","토","일"],today=localDate();
  $("#weekGrid").innerHTML=names.map((n,i)=>{
    let d=new Date(s);d.setDate(d.getDate()+i);let ds=localDate(d),items=schedules.filter(x=>x.schedule_date===ds);
    return `<div class="day-col ${ds===today?"today-col":""}" data-date="${ds}">
      <div class="day-head">${n}<b>${d.getDate()}</b></div>
      ${items.map(x=>`<div class="schedule-chip ${x.channel==="혜영이는 못말려"?"hyeyoung":x.channel==="오늘의 주우재"?"woojae":x.channel==="윤도운도윤"?"dowoon":"other"}" data-id="${x.id}">
        ${x.start_time?`<span class="time">${x.start_time.slice(0,5)}</span>`:""}${channelEmoji[x.channel]||"•"} ${esc(x.title)}
      </div>`).join("")}
    </div>`
  }).join("");
  $$(".schedule-chip").forEach(x=>x.onclick=()=>openSchedule(schedules.find(s=>String(s.id)===x.dataset.id)));
  $$(".day-col").forEach(x=>x.ondblclick=e=>{if(!e.target.closest(".schedule-chip"))openSchedule(null,x.dataset.date)});
}
$("#prevWeek").onclick=()=>{weekOffset--;renderWeek()};$("#nextWeek").onclick=()=>{weekOffset++;renderWeek()};$("#thisWeek").onclick=()=>{weekOffset=0;renderWeek()};$("#addSchedule").onclick=()=>openSchedule();
function openSchedule(s=null,date=null){
  $("#scheduleForm").reset();$("#scheduleId").value=s?.id||"";$("#scheduleModalTitle").textContent=s?"일정 수정":"일정 추가";
  $("#scheduleTitle").value=s?.title||"";$("#scheduleDate").value=s?.schedule_date||date||localDate();$("#scheduleChannel").value=s?.channel||"오늘의 주우재";
  $("#scheduleStart").value=s?.start_time?.slice(0,5)||"";$("#scheduleEnd").value=s?.end_time?.slice(0,5)||"";$("#scheduleMemo").value=s?.memo||"";
  $("#deleteSchedule").classList.toggle("hidden",!s);$("#scheduleDialog").showModal();
}
$("#saveSchedule").onclick=async()=>{
  let title=$("#scheduleTitle").value.trim(),date=$("#scheduleDate").value;if(!title||!date)return toast("일정과 날짜를 입력해 주세요.");
  let payload={user_id:user.id,title,channel:$("#scheduleChannel").value,schedule_date:date,start_time:$("#scheduleStart").value||null,end_time:$("#scheduleEnd").value||null,memo:$("#scheduleMemo").value};
  let id=$("#scheduleId").value,{error}=id?await sb.from("schedules").update(payload).eq("id",id):await sb.from("schedules").insert(payload);
  if(error)return toast("저장에 실패했어요.");$("#scheduleDialog").close();await loadSchedules();renderWeek();toast("일정을 저장했어요.");
};
$("#deleteSchedule").onclick=async()=>{let id=$("#scheduleId").value;if(!id||!confirm("이 일정을 삭제할까요?"))return;await sb.from("schedules").delete().eq("id",id);$("#scheduleDialog").close();await loadSchedules();renderWeek()};
function renderTodos(){
  let a=todos;$("#todoList").innerHTML=a.length?a.map(x=>`<div class="todo-item ${x.done?"done":""}"><input type="checkbox" data-id="${x.id}" ${x.done?"checked":""}><span>${esc(x.text)}</span><button data-del="${x.id}">×</button></div>`).join(""):`<div style="font-size:11px;color:#aaa;padding:10px 0">오늘 할 일을 추가해 보세요.</div>`;
  $$("#todoList input").forEach(x=>x.onchange=async()=>{await sb.from("todos").update({done:x.checked}).eq("id",+x.dataset.id);let t=todos.find(t=>t.id===+x.dataset.id);if(t)t.done=x.checked;renderTodos()});
  $$("#todoList button").forEach(x=>x.onclick=async()=>{let id=+x.dataset.del;await sb.from("todos").delete().eq("id",id);todos=todos.filter(t=>t.id!==id);renderTodos()});
}
async function addTodo(){let v=$("#todoInput").value.trim();if(!v)return;let {data,error}=await sb.from("todos").insert({user_id:user.id,text:v,done:false,todo_date:localDate()}).select().single();if(error)return toast("할 일 저장에 실패했어요.");todos.push(data);$("#todoInput").value="";renderTodos()}
$("#todoAdd").onclick=addTodo;$("#todoInput").onkeydown=e=>{if(e.key==="Enter")addTodo()};
function renderRecent(){
  let a=[...notes].sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)).slice(0,6);
  $("#recentNotes").innerHTML=a.length?a.map(n=>`<button class="recent-note" data-id="${n.id}">
    <span class="channel">${channelEmoji[n.channel]||"•"} ${esc(n.channel)}</span><h3>${esc(n.title||"제목 없음")}</h3><p>${esc(strip(n.content))}</p>
  </button>`).join(""):`<div style="font-size:12px;color:#aaa">아직 작성한 메모가 없어요.</div>`;
  $$(".recent-note").forEach(x=>x.onclick=()=>{let n=notes.find(n=>String(n.id)===x.dataset.id),p=Object.keys(channelMap).find(k=>channelMap[k]===n.channel);if(p){switchPage(p);openNote(n.id)}});
}
function filteredNotes(){
  let q=$("#noteSearch").value.trim().toLowerCase();
  return notes.filter(n=>n.channel===currentChannel&&(!q||(n.title||"").toLowerCase().includes(q)||strip(n.content).toLowerCase().includes(q)));
}
function renderNoteList(){
  let a=filteredNotes();$("#noteList").innerHTML=a.length?a.map(n=>`<div class="note-row ${currentNote?.id===n.id?"active":""}" data-id="${n.id}">
    <h3>${n.is_pinned?"📌 ":""}${esc(n.title||"제목 없음")}</h3><p>${esc(strip(n.content)||"내용 없음")}</p><div class="meta">${fmtDate(n.updated_at)} 수정</div>
  </div>`).join(""):`<div style="padding:22px;color:#aaa;font-size:11px">메모가 없습니다.</div>`;
  $$(".note-row").forEach(x=>x.onclick=()=>openNote(+x.dataset.id));
}
$("#noteSearch").oninput=renderNoteList;
function showEmptyEditor(){$("#emptyEditor").classList.remove("hidden");$("#editorWrap").classList.add("hidden")}
function openNote(id){
  currentNote=notes.find(n=>n.id===id);if(!currentNote)return;$("#emptyEditor").classList.add("hidden");$("#editorWrap").classList.remove("hidden");
  $("#noteTitle").value=currentNote.title||"";$("#noteContent").innerHTML=currentNote.content||"";$("#pinNote").textContent=currentNote.is_pinned?"📌 고정됨":"📌 고정";updateUpdated();renderNoteList();
}
$("#newNote").onclick=async()=>{
  const {data,error}=await sb.from("notes").insert({user_id:user.id,channel:currentChannel,title:"새 메모",content:""}).select().single();
  if(error)return toast("메모 생성에 실패했어요.");notes.unshift(data);renderNoteList();openNote(data.id);$("#noteTitle").select();
};
function scheduleSave(){if(!currentNote)return;$("#saveState").textContent="저장 중…";clearTimeout(saveTimer);saveTimer=setTimeout(saveCurrentNote,600)}
async function saveCurrentNote(){
  if(!currentNote)return;
  let payload={title:$("#noteTitle").value,content:$("#noteContent").innerHTML};
  if(payload.title===currentNote.title&&payload.content===currentNote.content){$("#saveState").textContent="자동 저장됨";return}
  await sb.from("note_versions").insert({user_id:user.id,note_id:currentNote.id,title:currentNote.title||"",content:currentNote.content||""});
  const {data,error}=await sb.from("notes").update(payload).eq("id",currentNote.id).select().single();
  if(error){$("#saveState").textContent="저장 실패";return}
  Object.assign(currentNote,data);$("#saveState").textContent="자동 저장됨";updateUpdated();renderNoteList();renderRecent();
}
$("#noteTitle").oninput=scheduleSave;$("#noteContent").oninput=scheduleSave;
function updateUpdated(){if(currentNote)$("#updatedText").textContent=`마지막 수정 ${new Date(currentNote.updated_at).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}`}
$("#pinNote").onclick=async()=>{if(!currentNote)return;let v=!currentNote.is_pinned;const {data}=await sb.from("notes").update({is_pinned:v}).eq("id",currentNote.id).select().single();if(data){Object.assign(currentNote,data);notes.sort((a,b)=>(b.is_pinned-a.is_pinned)||new Date(b.updated_at)-new Date(a.updated_at));openNote(currentNote.id)}};
$("#deleteNote").onclick=()=>{if(!currentNote||!confirm("이 메모를 삭제할까요?"))return;let doomed={...currentNote},id=doomed.id;notes=notes.filter(n=>n.id!==id);currentNote=null;showEmptyEditor();renderNoteList();renderRecent();let wasUndone=false;undoToast("메모를 삭제했어요.",()=>{wasUndone=true;notes.unshift(doomed);notes.sort((a,b)=>(b.is_pinned-a.is_pinned)||new Date(b.updated_at)-new Date(a.updated_at));renderNoteList();renderRecent();openNote(id)},4000);setTimeout(async()=>{if(!wasUndone)await sb.from("notes").delete().eq("id",id)},4000)};
$$(".toolbar [data-cmd]").forEach(b=>b.onclick=()=>{document.execCommand(b.dataset.cmd,false,null);$("#noteContent").focus();scheduleSave()});
$("#fontSize").onchange=e=>{document.execCommand("fontSize",false,e.target.value);$("#noteContent").focus();scheduleSave()};

// Editor keyboard shortcuts: Cmd/Ctrl+B = bold, Cmd/Ctrl +/- = font size
$("#noteContent").addEventListener("keydown", e=>{
  if(!(e.metaKey||e.ctrlKey)) return;
  const key=e.key.toLowerCase();
  if(key==="b"){
    e.preventDefault();
    document.execCommand("bold",false,null);
    scheduleSave();
    return;
  }
  if(key==="+"||key==="="||key==="-"||key==="_"){
    e.preventDefault();
    const select=$("#fontSize");
    let size=parseInt(select.value||"3",10);
    size += (key==="+"||key==="=") ? 1 : -1;
    size=Math.max(2,Math.min(5,size));
    select.value=String(size);
    document.execCommand("fontSize",false,String(size));
    scheduleSave();
  }
});

$("#linkBtn").onclick=()=>{insertLinkCard()};

// Checklist: turn the current line / selected lines into real clickable checklist items.
$("#checkBtn").onclick=()=>convertSelectionToChecklist();

function checklistHTML(text=""){
  const safe=(text||"").replace(/<br\s*\/?>/gi,"").trim();
  return `<div class="check-line" data-checked="false"><span class="check-box" contenteditable="false"></span><span class="check-text">${safe||"<br>"}</span></div>`;
}
function currentEditorBlock(node){
  if(!node)return null;
  if(node.nodeType===3)node=node.parentElement;
  while(node&&node!==$("#noteContent")){
    if(node.parentElement===$("#noteContent")||node.classList?.contains("check-line"))return node;
    node=node.parentElement;
  }
  return null;
}
function placeCaretInCheck(line){
  const text=line?.querySelector(".check-text");if(!text)return;
  const range=document.createRange(),sel=window.getSelection();
  range.selectNodeContents(text);range.collapse(false);sel.removeAllRanges();sel.addRange(range);text.focus?.();
}
function convertSelectionToChecklist(){
  const editor=$("#noteContent");editor.focus();
  const sel=window.getSelection();if(!sel||!sel.rangeCount)return;
  const range=sel.getRangeAt(0);
  if(!editor.contains(range.commonAncestorContainer))return;

  if(range.collapsed){
    let block=currentEditorBlock(range.startContainer);
    if(block?.classList?.contains("check-line"))return placeCaretInCheck(block);
    if(!block){
      document.execCommand("insertHTML",false,checklistHTML(""));
      const lines=editor.querySelectorAll(".check-line");placeCaretInCheck(lines[lines.length-1]);scheduleSave();return;
    }
    const line=document.createElement("div");line.className="check-line";line.dataset.checked="false";
    const box=document.createElement("span");box.className="check-box";box.contentEditable="false";
    const text=document.createElement("span");text.className="check-text";
    while(block.firstChild)text.appendChild(block.firstChild);
    if(!text.innerHTML.trim())text.innerHTML="<br>";
    line.append(box,text);block.replaceWith(line);placeCaretInCheck(line);scheduleSave();return;
  }

  const frag=range.cloneContents(),holder=document.createElement("div");holder.appendChild(frag);
  let parts=[...holder.children].map(el=>el.innerHTML).filter(x=>x.replace(/<br\s*\/?>/gi,"").trim());
  if(!parts.length)parts=holder.innerText.split(/\n+/).map(x=>x.trim()).filter(Boolean).map(escapeHTML);
  if(!parts.length)parts=[escapeHTML(sel.toString())];
  document.execCommand("insertHTML",false,parts.map(checklistHTML).join(""));
  scheduleSave();
}
function escapeHTML(s){const d=document.createElement("div");d.textContent=s||"";return d.innerHTML}

$("#noteContent").addEventListener("click",e=>{
  let box=e.target.closest(".check-box");if(!box)return;
  e.preventDefault();
  let line=box.closest(".check-line"),checked=!line.classList.contains("checked");
  line.classList.toggle("checked",checked);line.dataset.checked=String(checked);box.textContent=checked?"✓":"";
  scheduleSave();
});

// Enter on a checklist item creates the next checklist item.
// Enter on an empty checklist item exits checklist mode.
$("#noteContent").addEventListener("keydown",e=>{
  if(e.key!=="Enter"||e.shiftKey)return;
  const sel=window.getSelection();if(!sel?.rangeCount)return;
  const line=currentEditorBlock(sel.anchorNode);
  if(!line?.classList?.contains("check-line"))return;
  e.preventDefault();
  const text=line.querySelector(".check-text");
  if(!(text?.innerText||"").trim()){
    const normal=document.createElement("div");normal.innerHTML="<br>";line.replaceWith(normal);
    const r=document.createRange();r.selectNodeContents(normal);r.collapse(true);sel.removeAllRanges();sel.addRange(r);
  }else{
    const next=document.createElement("div");next.className="check-line";next.dataset.checked="false";
    next.innerHTML='<span class="check-box" contenteditable="false"></span><span class="check-text"><br></span>';
    line.after(next);placeCaretInCheck(next);
  }
  scheduleSave();
});
function insertLinkCard(){
  let raw=prompt("링크 주소를 입력해 주세요.");if(!raw)return;let u;try{u=new URL(raw.match(/^https?:\/\//)?raw:"https://"+raw)}catch{return toast("올바른 링크 주소를 입력해 주세요.")}
  if(!["http:","https:"].includes(u.protocol))return toast("http/https 링크만 사용할 수 있어요.");
  let selected=window.getSelection()?.toString().trim(),label=selected||u.hostname.replace(/^www\./,"");
  let href=esc(u.href),title=esc(label),host=esc(u.hostname.replace(/^www\./,""));
  document.execCommand("insertHTML",false,`<a class="link-card" href="${href}" target="_blank" rel="noopener noreferrer" contenteditable="false"><strong>🔗 ${title}</strong><small>${host} · ${href}</small></a><div><br></div>`);$("#noteContent").focus();scheduleSave();
}

// Previous versions
$("#versionsBtn").onclick=async()=>{
  if(!currentNote)return;const {data,error}=await sb.from("note_versions").select("*").eq("note_id",currentNote.id).order("created_at",{ascending:false}).limit(30);
  if(error)return toast("이전 버전을 불러오지 못했어요.");
  $("#versionList").innerHTML=(data||[]).length?(data||[]).map(v=>`<div class="version-row"><div><div class="meta">${new Date(v.created_at).toLocaleString("ko-KR")}</div><h3>${esc(v.title||"제목 없음")}</h3><p>${esc(strip(v.content)||"내용 없음")}</p></div><button data-version="${v.id}">복원</button></div>`).join(""):`<div class="idea-empty">저장된 이전 버전이 아직 없어요.</div>`;
  $$("[data-version]").forEach(b=>b.onclick=()=>restoreVersion((data||[]).find(v=>String(v.id)===b.dataset.version)));$("#versionsDialog").showModal();
};
$("#closeVersions").onclick=()=>$("#versionsDialog").close();
async function restoreVersion(v){if(!v||!currentNote)return;await sb.from("note_versions").insert({user_id:user.id,note_id:currentNote.id,title:currentNote.title||"",content:currentNote.content||""});const {data,error}=await sb.from("notes").update({title:v.title,content:v.content}).eq("id",currentNote.id).select().single();if(error)return toast("복원에 실패했어요.");Object.assign(currentNote,data);openNote(currentNote.id);$("#versionsDialog").close();toast("이전 버전으로 복원했어요.")}

// Global search: notes + ideas + schedules
let searchTimer=null;
$("#globalSearch").addEventListener("input",e=>{clearTimeout(searchTimer);let q=e.target.value.trim();if(!q)return;searchTimer=setTimeout(()=>showGlobalSearch(q),180)});
$("#globalSearch").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.value.trim())showGlobalSearch(e.target.value.trim())});
$("#closeSearch").onclick=()=>$("#searchDialog").close();
function showGlobalSearch(q){let l=q.toLowerCase(),results=[];notes.forEach(n=>{if(((n.title||"")+" "+strip(n.content)).toLowerCase().includes(l))results.push({type:"메모",title:n.title||"제목 없음",sub:`${channelEmoji[n.channel]||"•"} ${n.channel} · ${strip(n.content)}`,kind:"note",id:n.id,channel:n.channel})});ideas.forEach(i=>{if(((i.title||"")+" "+(i.content||"")+" "+(i.category||"")).toLowerCase().includes(l))results.push({type:"아이디어",title:i.title||"제목 없음",sub:`${i.category} · ${i.content||""}`,kind:"idea",id:i.id})});schedules.forEach(x=>{if(((x.title||"")+" "+(x.memo||"")+" "+(x.channel||"")).toLowerCase().includes(l))results.push({type:"일정",title:x.title,sub:`${x.schedule_date} · ${x.channel}${x.memo?" · "+x.memo:""}`,kind:"schedule",id:x.id})});$("#searchQueryLabel").textContent=`“${q}” 검색 결과 ${results.length}개`;$("#globalResults").innerHTML=results.length?results.slice(0,80).map((r,i)=>`<button class="search-result" data-result="${i}"><span class="type">${r.type}</span><h3>${esc(r.title)}</h3><p>${esc(r.sub)}</p></button>`).join(""):`<div class="idea-empty">검색 결과가 없어요.</div>`;$$('[data-result]').forEach(b=>b.onclick=()=>openSearchResult(results[+b.dataset.result]));$("#searchDialog").showModal()}
function openSearchResult(r){$("#searchDialog").close();$("#globalSearch").value="";if(r.kind==="note"){let p=Object.keys(channelMap).find(k=>channelMap[k]===r.channel);if(p){switchPage(p);openNote(r.id)}}else if(r.kind==="idea"){switchPage("ideas");openIdea(ideas.find(x=>x.id===r.id))}else{switchPage("home");openSchedule(schedules.find(x=>x.id===r.id))}}

boot();

// ---------------- IDEA ARCHIVE ----------------
function ideaClass(c){return c==="패션"?"fashion":c==="뷰티"?"beauty":c==="브이로그"?"vlog":c==="예능"?"ent":"etc"}
function renderIdeas(){
  let q=$("#ideaSearch").value.trim().toLowerCase();
  let a=ideas.filter(x=>x.status===ideaStatus&&(ideaCategory==="전체"||x.category===ideaCategory)&&(!q||(x.title||"").toLowerCase().includes(q)||(x.content||"").toLowerCase().includes(q)));
  $("#ideaGrid").innerHTML=a.length?a.map(x=>`<article class="idea-card">
    <div class="idea-card-top"><span class="idea-category ${ideaClass(x.category)}">${esc(x.category)}</span><span class="idea-date">${fmtDate(x.updated_at)}</span></div>
    <h3>${esc(x.title||"제목 없음")}</h3><p>${esc(x.content||"내용 없음")}</p>
    <div class="idea-card-actions">
      <button data-edit="${x.id}">수정</button>
      ${ideaStatus!=="active"?`<button data-move="${x.id}" data-to="active">아이디어로</button>`:""}
      ${ideaStatus!=="used"?`<button class="used" data-move="${x.id}" data-to="used">✓ 사용</button>`:""}
      ${ideaStatus!=="hold"?`<button class="hold" data-move="${x.id}" data-to="hold">보류</button>`:""}
    </div>
  </article>`).join(""):`<div class="idea-empty">여기에 저장된 아이디어가 아직 없어요.</div>`;
  $$("[data-edit]").forEach(b=>b.onclick=()=>openIdea(ideas.find(x=>String(x.id)===b.dataset.edit)));
  $$("[data-move]").forEach(b=>b.onclick=()=>moveIdea(+b.dataset.move,b.dataset.to));
}
$$(".idea-tab").forEach(b=>b.onclick=()=>{ideaStatus=b.dataset.status;$$(".idea-tab").forEach(x=>x.classList.toggle("active",x===b));renderIdeas()});
$$(".idea-filter").forEach(b=>b.onclick=()=>{ideaCategory=b.dataset.category;$$(".idea-filter").forEach(x=>x.classList.toggle("active",x===b));renderIdeas()});
$("#ideaSearch").oninput=renderIdeas;
$("#newIdea").onclick=()=>openIdea();
function openIdea(x=null){
  $("#ideaForm").reset();$("#ideaId").value=x?.id||"";$("#ideaModalTitle").textContent=x?"아이디어 수정":"아이디어 추가";
  $("#ideaCategory").value=x?.category||"패션";$("#ideaTitle").value=x?.title||"";$("#ideaContent").value=x?.content||"";
  $("#deleteIdea").classList.toggle("hidden",!x);$("#ideaDialog").showModal();
}
$("#saveIdea").onclick=async()=>{
  let title=$("#ideaTitle").value.trim();if(!title)return toast("제목을 입력해 주세요.");
  let id=$("#ideaId").value,payload={user_id:user.id,category:$("#ideaCategory").value,title,content:$("#ideaContent").value,status:id?(ideas.find(x=>String(x.id)===id)?.status||"active"):"active"};
  let {error}=id?await sb.from("ideas").update(payload).eq("id",id):await sb.from("ideas").insert(payload);
  if(error)return toast("아이디어 저장에 실패했어요.");$("#ideaDialog").close();await loadIdeas();renderIdeas();toast("아이디어를 저장했어요.");
};
$("#deleteIdea").onclick=async()=>{let id=$("#ideaId").value;if(!id||!confirm("이 아이디어를 삭제할까요?"))return;await sb.from("ideas").delete().eq("id",id);$("#ideaDialog").close();await loadIdeas();renderIdeas()};
async function moveIdea(id,status){
  const {error}=await sb.from("ideas").update({status}).eq("id",id);if(error)return toast("이동에 실패했어요.");await loadIdeas();renderIdeas();toast(status==="used"?"사용 보관함으로 이동했어요.":status==="hold"?"보류 보관함으로 이동했어요.":"아이디어로 되돌렸어요.");
}
