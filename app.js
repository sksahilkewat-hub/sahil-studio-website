(() => {
const cfg = window.SAHIL_CONFIG || {};
const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("PASTE_") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("PASTE_");
const sb = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY) : null;
const $ = (s,root=document)=>root.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = v => v===null || v==="" || v===undefined ? "Contact for price" : "₹"+Number(v).toLocaleString("en-IN");
const toast = msg => {const t=$("#toast");t.textContent=msg;t.style.display="block";setTimeout(()=>t.style.display="none",3500)};
const fallback = {
 services:[
  {id:"s1",name:"Wedding Photography",description:"Beautifully composed photographs that preserve every emotion and detail.",image_url:"https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80",active:true},
  {id:"s2",name:"Cinematic Films",description:"Story-led wedding films, highlights and memorable event coverage.",image_url:"https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80",active:true},
  {id:"s3",name:"Pre-wedding Shoots",description:"Personal, creative portraits in locations and styles you love.",image_url:"https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=900&q=80",active:true}
 ],
 packages:[], albums:[], gallery:[]
};
let data = structuredClone(fallback);
function setContact(){
 $("#year").textContent=new Date().getFullYear();
 const phone=cfg.STUDIO_PHONE||"+91 82926 48897", wa=cfg.WHATSAPP_NUMBER||"918292648897";
 $("#phoneLink").textContent=phone;$("#phoneLink").href="tel:"+phone.replace(/[^\d+]/g,"");
 $("#whatsappLink").href="https://wa.me/"+wa;
 $("#studioAddress").textContent=cfg.STUDIO_ADDRESS||"Dihrigarh, Harnaut, Bihar, India";
 if(cfg.INSTAGRAM_URL){$("#instagramLink").href=cfg.INSTAGRAM_URL;$("#instagramLink").textContent=cfg.INSTAGRAM_URL.replace(/\/$/,"").split("/").pop();}
}
function card(item,type){
 const image=item.image_url?`<img src="${esc(item.image_url)}" alt="${esc(item.name||item.title||"Sahil Studio work")}" loading="lazy">`:"";
 let extra="";
 if(type==="packages") extra=`<div class="price">${money(item.price)}</div><p>${esc(item.description)}</p><p class="card-meta">${esc(item.inclusions||"Contact us for package details")}</p>`;
 else if(type==="albums") extra=`<div class="price">${money(item.price)}</div><p>${esc(item.description||"Premium album collection")}</p><p class="card-meta">${esc(item.size||"Size details on enquiry")}${item.pages?" · "+esc(item.pages)+" pages":""}</p>`;
 else extra=`<p>${esc(item.description||"")}</p>`;
 return `<article class="content-card">${image}<div class="card-body"><h3>${esc(item.name||item.title||"")}</h3>${extra}</div></article>`;
}
function renderPublic(){
 $("#servicesGrid").innerHTML=data.services.filter(x=>x.active!==false).map(x=>card(x,"services")).join("")||'<p class="muted">Service details will be added soon.</p>';
 $("#packagesGrid").innerHTML=data.packages.filter(x=>x.active!==false).map(x=>card(x,"packages")).join("")||'<p class="muted">Packages and prices will be updated soon. Please contact us for details.</p>';
 $("#albumsGrid").innerHTML=data.albums.filter(x=>x.active!==false).map(x=>card(x,"albums")).join("")||'<p class="muted">Album options and prices will be updated soon.</p>';
 $("#galleryGrid").innerHTML=data.gallery.filter(x=>x.active!==false).map(x=>`<img src="${esc(x.image_url)}" alt="${esc(x.caption||"Sahil Studio photography")}" loading="lazy">`).join("")||'<p class="muted">Gallery images will appear here.</p>';
}
async function loadPublic(){
 if(!sb){renderPublic();return}
 try{
  const names=["services","packages","albums","gallery"];
  const results=await Promise.all(names.map(t=>sb.from(t).select("*").eq("active",true).order("created_at",{ascending:false})));
  results.forEach((r,i)=>{if(!r.error)data[names[i]]=r.data||[]});
  const {data:settings}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();
  if(settings){
   cfg.STUDIO_PHONE=settings.phone||cfg.STUDIO_PHONE;
   cfg.WHATSAPP_NUMBER=settings.whatsapp||cfg.WHATSAPP_NUMBER;
   cfg.STUDIO_ADDRESS=settings.address||cfg.STUDIO_ADDRESS;
   cfg.INSTAGRAM_URL=settings.instagram_url||cfg.INSTAGRAM_URL;
   setContact();
  }
  renderPublic();
 }catch(e){console.error(e);renderPublic()}
}
$("#mobileMenu").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$("#mainNav").addEventListener("click",e=>{if(e.target.tagName==="A")$("#mainNav").classList.remove("open")});
$("#enquiryForm").addEventListener("submit",async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);
 const row={name:f.get("name").trim(),phone:f.get("phone").trim(),event_type:f.get("event_type"),event_date:f.get("event_date")||null,message:f.get("message").trim(),status:"new"};
 const msg=$("#formMessage");msg.textContent="Sending…";
 if(sb){const {error}=await sb.from("enquiries").insert(row);if(error){msg.textContent="Sorry, we couldn't submit your enquiry. Please WhatsApp or call us.";return}}
 else {msg.textContent="Database is not connected yet. Please WhatsApp or call us.";return}
 msg.textContent="Thank you! Your enquiry has been received. We'll contact you soon.";e.currentTarget.reset();
});
setContact();loadPublic();

/* ADMIN */
const admin=$("#adminApp");
const sections={
 dashboard:{title:"Dashboard"},
 services:{title:"Services",table:"services",fields:[["name","Service name","text",true],["description","Description","textarea"],["image_url","Image URL","url"],["sort_order","Display order","number"],["active","Visible on website","checkbox"]]},
 packages:{title:"Packages",table:"packages",fields:[["name","Package name","text",true],["price","Price (INR)","number"],["description","Description","textarea"],["inclusions","What's included","textarea"],["image_url","Image URL","url"],["sort_order","Display order","number"],["active","Visible on website","checkbox"]]},
 albums:{title:"Albums",table:"albums",fields:[["name","Album name","text",true],["size","Album size (e.g. 12×18)","text"],["price","Price (INR)","number"],["pages","Number of pages","number"],["description","Description / finish","textarea"],["image_url","Image URL","url"],["sort_order","Display order","number"],["active","Visible on website","checkbox"]]},
 gallery:{title:"Gallery",table:"gallery",fields:[["caption","Photo caption","text"],["image_url","Image URL (or upload below)","url",true],["category","Category","text"],["sort_order","Display order","number"],["active","Visible on website","checkbox"]]},
 enquiries:{title:"Customer enquiries",table:"enquiries"}
};
let current="dashboard",editId=null,adminUser=null;
function adminHeader(){return `<header class="admin-top"><a class="brand" href="#home"><span class="brand-mark">SS</span><span><b>SAHIL STUDIO</b><small>ADMINISTRATION</small></span></a><div><span id="adminEmail" style="font-size:11px;color:#d0c4ae;margin-right:12px"></span><button class="button button-outline" id="logoutBtn">Log out</button></div></header>`}
function loginView(message=""){
 admin.innerHTML=`<div class="admin-login-wrap"><form class="admin-login" id="loginForm"><div class="brand"><span class="brand-mark">SS</span><span><b>SAHIL STUDIO</b><small>SECURE ADMIN ACCESS</small></span></div><h1>Welcome back.</h1><p>Sign in to manage your studio website, packages, albums, gallery and enquiries.</p><label>Email address<input name="email" type="email" required autocomplete="username" placeholder="Admin email"></label><label>Password<input name="password" type="password" required autocomplete="current-password" placeholder="Password"></label><button class="button button-gold" type="submit">Sign in</button><p class="form-message">${esc(message)}</p><div class="admin-hint">Admin access must be created in your Supabase project. See SETUP.md for the one-time setup.</div><a href="#home" style="font-size:12px;color:#806536">← Back to public website</a></form></div>`;
 $("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const btn=e.currentTarget.querySelector("button");btn.disabled=true;btn.textContent="Signing in…";const {error}=await sb.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});if(error){loginView("Sign-in failed: "+error.message)}else{await checkAdmin()}});
}
function adminShell(){
 admin.innerHTML=adminHeader()+`<div class="admin-layout"><aside class="admin-side">${["dashboard","services","packages","albums","gallery","enquiries","settings"].map(k=>`<button data-tab="${k}" class="${current===k?"active":""}">${({dashboard:"Overview",services:"Services",packages:"Packages",albums:"Albums",gallery:"Gallery",enquiries:"Enquiries",settings:"Studio settings"})[k]}</button>`).join("")}</aside><main class="admin-main" id="adminContent"></main></div>`;
 $("#adminEmail").textContent=adminUser?.email||"";$("#logoutBtn").addEventListener("click",async()=>{await sb.auth.signOut();location.hash="#home";admin.hidden=true;$("#app").hidden=false});
 admin.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{current=b.dataset.tab;adminShell();loadAdminSection()}));
 loadAdminSection();
}
async function checkAdmin(){
 if(!sb){loginView("Connect Supabase first. Follow SETUP.md.");return}
 const {data:{user}}=await sb.auth.getUser();if(!user){loginView();return}
 const {data:role,error}=await sb.from("user_roles").select("user_id").eq("user_id",user.id).maybeSingle();
 if(error||!role){await sb.auth.signOut();loginView("This account is not an authorized studio admin.");return}
 adminUser=user;admin.hidden=false;$("#app").hidden=true;adminShell();
}
function tableRows(rows,kind){
 if(kind==="enquiries")return rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.phone)}</td><td>${esc(r.event_type||"—")}</td><td>${esc(r.event_date||"—")}</td><td><select class="status-select" data-status="${esc(r.id)}"><option ${r.status==="new"?"selected":""}>new</option><option ${r.status==="contacted"?"selected":""}>contacted</option><option ${r.status==="booked"?"selected":""}>booked</option><option ${r.status==="closed"?"selected":""}>closed</option></select></td><td>${esc(r.message||"")}</td><td><button class="small-btn danger" data-delete="${esc(r.id)}">Delete</button></td></tr>`).join("");
 return rows.map(r=>`<tr><td>${esc(r.name||r.caption||"")}</td><td>${kind==="packages"||kind==="albums"?money(r.price):esc(r.size||r.category||"—")}</td><td>${r.active===false?"Hidden":"Visible"}</td><td><div class="table-actions"><button class="small-btn" data-edit="${esc(r.id)}">Edit</button><button class="small-btn danger" data-delete="${esc(r.id)}">Delete</button></div></td></tr>`).join("");
}
async function getRows(table){
 const {data,error}=await sb.from(table).select("*").order("created_at",{ascending:false});if(error){toast(error.message);return []}return data||[];
}
async function loadAdminSection(){
 const host=$("#adminContent");if(!host)return;
 if(current==="dashboard"){
  const [s,p,a,g,e]=await Promise.all(["services","packages","albums","gallery","enquiries"].map(getRows));
  host.innerHTML=`<div class="admin-title"><div><p class="eyebrow">SAHIL STUDIO CONTROL CENTRE</p><h1>Welcome back.</h1></div><a class="button button-dark" href="#home">View website ↗</a></div><div class="stats-grid">${[["Services",s.length],["Packages",p.length],["Albums",a.length],["New enquiries",e.filter(x=>x.status==="new").length]].map(x=>`<div class="stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("")}</div><div class="admin-panel"><h3>Quick start</h3><p class="muted">Use the menu to add your real services, set package and album prices, upload portfolio images, and follow up with customer enquiries. Changes are saved to your Supabase database.</p></div>`;
  return;
 }
 if(current==="settings"){await renderSettings(host);return}
 const sec=sections[current];const rows=await getRows(sec.table);
 if(current==="enquiries"){
  host.innerHTML=`<div class="admin-title"><div><p class="eyebrow">CUSTOMER MANAGEMENT</p><h1>${sec.title}</h1></div><button class="button button-dark" id="refreshBtn">Refresh</button></div><div class="admin-panel"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Event</th><th>Date</th><th>Status</th><th>Message</th><th></th></tr></thead><tbody>${tableRows(rows,"enquiries")||'<tr><td colspan="7">No enquiries yet.</td></tr>'}</tbody></table></div></div>`;
  host.querySelector("#refreshBtn").onclick=loadAdminSection;
  host.querySelectorAll("[data-status]").forEach(el=>el.onchange=async()=>{const {error}=await sb.from("enquiries").update({status:el.value}).eq("id",el.dataset.status);toast(error?error.message:"Enquiry status updated")});
  host.querySelectorAll("[data-delete]").forEach(el=>el.onclick=()=>deleteRow("enquiries",el.dataset.delete));
  return;
 }
 host.innerHTML=`<div class="admin-title"><div><p class="eyebrow">CONTENT MANAGEMENT</p><h1>${sec.title}</h1></div><button class="button button-gold" id="newBtn">+ Add ${sec.title.slice(0,-1)||"item"}</button></div><div class="admin-panel" id="editor" hidden></div><div class="admin-panel"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Name</th><th>Details</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>${tableRows(rows,current)||'<tr><td colspan="4">No items yet. Click Add to create your first item.</td></tr>'}</tbody></table></div></div>`;
 $("#newBtn").onclick=()=>showEditor(sec,null);
 host.querySelectorAll("[data-edit]").forEach(el=>el.onclick=()=>showEditor(sec,rows.find(r=>String(r.id)===el.dataset.edit)));
 host.querySelectorAll("[data-delete]").forEach(el=>el.onclick=()=>deleteRow(sec.table,el.dataset.delete));
}
function showEditor(sec,row){
 editId=row?.id||null;const editor=$("#editor");editor.hidden=false;
 const fields=sec.fields.map(([key,label,type,required])=>{
  const val=row?.[key]??(key==="active"?true:key==="sort_order"?0:"");
  if(type==="checkbox")return `<label class="checkrow full"><input type="checkbox" name="${key}" ${val?"checked":""}> ${label}</label>`;
  if(type==="textarea")return `<label class="full">${label}<textarea name="${key}" ${required?"required":""}>${esc(val)}</textarea></label>`;
  return `<label>${label}<input name="${key}" type="${type}" value="${esc(val)}" ${required?"required":""} ${type==="number"?'min="0" step="1"':""}></label>`;
 }).join("");
 const uploadField=sec.table==="gallery"?`<label class="full">Or upload a photo (JPG, PNG, WEBP; max 10 MB)<input name="photo_file" type="file" accept="image/jpeg,image/png,image/webp"></label>`:"";
 editor.innerHTML=`<h3>${row?"Edit":"Add"} ${sec.title.slice(0,-1)||"item"}</h3><form class="admin-form" id="itemForm">${fields}${uploadField}<div class="full" style="display:flex;gap:9px"><button class="button button-gold" type="submit">Save</button><button class="button" type="button" id="cancelEdit">Cancel</button></div></form>`;
 $("#cancelEdit").onclick=()=>editor.hidden=true;
 $("#itemForm").onsubmit=async e=>{
  e.preventDefault();const form=new FormData(e.currentTarget),obj={};
  sec.fields.forEach(([key,,type])=>{obj[key]=type==="checkbox"?e.currentTarget.elements[key].checked:type==="number"?(form.get(key)===""?null:Number(form.get(key))):(form.get(key)||"").toString().trim()});
  if(sec.table==="gallery"){
   const file=e.currentTarget.elements.photo_file?.files?.[0];
   if(file){
    if(file.size>10*1024*1024){toast("Photo must be 10 MB or smaller.");return}
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){toast("Use a JPG, PNG or WEBP image.");return}
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
    const path=`gallery/${Date.now()}-${safeName}`;
    const {error:uploadError}=await sb.storage.from("studio-media").upload(path,file,{upsert:false,contentType:file.type});
    if(uploadError){toast("Photo upload failed: "+uploadError.message);return}
    obj.image_url=sb.storage.from("studio-media").getPublicUrl(path).data.publicUrl;
   }
  }
  const query=editId?sb.from(sec.table).update(obj).eq("id",editId):sb.from(sec.table).insert(obj);
  const {error}=await query;if(error){toast(error.message);return}toast("Saved successfully");loadAdminSection();
 };
}
async function deleteRow(table,id){
 if(!confirm("Delete this item permanently?"))return;
 const {error}=await sb.from(table).delete().eq("id",id);if(error){toast(error.message);return}toast("Deleted");loadAdminSection();
}
async function renderSettings(host){
 const {data,error}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();
 if(error){host.innerHTML=`<div class="admin-title"><h1>Studio settings</h1></div><div class="admin-panel">${esc(error.message)}<p>Run the SQL setup file first.</p></div>`;return}
 const v=data||{};
 host.innerHTML=`<div class="admin-title"><div><p class="eyebrow">BUSINESS INFORMATION</p><h1>Studio settings</h1></div></div><div class="admin-panel"><form class="admin-form" id="settingsForm"><label>Studio name<input name="studio_name" value="${esc(v.studio_name||"Sahil Studio")}" required></label><label>Phone number<input name="phone" value="${esc(v.phone||"+91 82926 48897")}"></label><label>WhatsApp number (country code + digits)<input name="whatsapp" value="${esc(v.whatsapp||"918292648897")}"></label><label>Instagram URL<input name="instagram_url" value="${esc(v.instagram_url||"")}"></label><label class="full">Studio address<textarea name="address">${esc(v.address||"Dihrigarh, Harnaut, Bihar, India")}</textarea></label><div class="full"><button class="button button-gold">Save settings</button></div></form></div>`;
 $("#settingsForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const obj={id:1,studio_name:f.get("studio_name"),phone:f.get("phone"),whatsapp:f.get("whatsapp"),instagram_url:f.get("instagram_url"),address:f.get("address")};const {error}=await sb.from("site_settings").upsert(obj);toast(error?error.message:"Studio settings saved. Update config.js too if you want the contact buttons to reflect these changes immediately.")};
}
function route(){
 if(location.hash==="#admin"){admin.hidden=false;$("#app").hidden=true;if(!sb){loginView("Supabase is not configured. Complete SETUP.md first.");return}sb.auth.getSession().then(({data})=>data.session?checkAdmin():loginView());}
 else{admin.hidden=true;$("#app").hidden=false}
}
window.addEventListener("hashchange",route);route();
})();