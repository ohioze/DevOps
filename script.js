const btn=document.querySelector('.menu-btn');
const nav=document.querySelector('.mobile-nav');
btn?.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));nav.setAttribute('aria-hidden',String(!open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');btn.setAttribute('aria-expanded','false');nav.setAttribute('aria-hidden','true');}));
document.querySelector('#year').textContent=new Date().getFullYear();
