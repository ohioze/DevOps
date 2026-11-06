const btn = document.querySelector('.menu-btn');
const nav = document.querySelector('.mobile-nav');

btn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
  nav.setAttribute('aria-hidden', String(!open));
});

nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
  nav.setAttribute('aria-hidden', 'true');
}));

document.querySelector('#year').textContent = new Date().getFullYear();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const stages = [...document.querySelectorAll('.pipeline-stage')];
const connectors = [...document.querySelectorAll('.pipeline-connector')];
const terminal = document.querySelector('#lab-terminal');
const labState = document.querySelector('#lab-state');
const runBtn = document.querySelector('#run-lab');
const incidentBtn = document.querySelector('#inject-incident');
let pipelineRunning = false;
let incidentRunning = false;

function appendTerminal(text, type = 'normal') {
  if (!terminal) return;
  const line = document.createElement('div');
  const cls = type === 'ok' ? 'term-ok' : type === 'warn' ? 'term-warn' : type === 'error' ? 'term-error' : type === 'muted' ? 'term-muted' : '';
  line.innerHTML = `<span class="${cls}">${text}</span>`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function resetPipeline() {
  stages.forEach(stage => stage.classList.remove('running', 'complete', 'failed'));
  connectors.forEach(c => c.classList.remove('active'));
  if (terminal) terminal.innerHTML = '';
}

async function runPipeline() {
  if (pipelineRunning) return;
  pipelineRunning = true;
  if (runBtn) runBtn.disabled = true;
  if (incidentBtn) incidentBtn.disabled = true;
  resetPipeline();
  if (labState) labState.textContent = 'PIPELINE RUNNING';

  const steps = [
    ['$ git push origin main', 'Commit received: 7f3a2c1'],
    ['$ npm ci && npm run build', 'Build artifact created successfully'],
    ['$ npm test', '42 tests passed · 0 failed'],
    ['$ security-scan --severity high', 'No critical or high vulnerabilities detected'],
    ['$ terraform plan -out=tfplan', 'Plan: 2 to add, 1 to change, 0 to destroy'],
    ['$ kubectl apply -f deploy/', 'Production rollout started'],
    ['$ kubectl rollout status deployment/web', 'Rollout complete · monitoring active']
  ];

  for (let i = 0; i < stages.length; i++) {
    stages[i].classList.add('running');
    if (i > 0 && connectors[i - 1]) connectors[i - 1].classList.add('active');
    appendTerminal(`<span class="term-prompt">${steps[i][0]}</span>`);
    await sleep(650);
    appendTerminal(`✓ ${steps[i][1]}`, 'ok');
    await sleep(450);
    stages[i].classList.remove('running');
    stages[i].classList.add('complete');
  }

  appendTerminal('✓ Smoke tests passed', 'ok');
  appendTerminal('✓ Datadog monitors healthy', 'ok');
  appendTerminal('✓ Deployment complete: production healthy', 'ok');
  if (labState) labState.textContent = 'PRODUCTION HEALTHY';
  pipelineRunning = false;
  if (runBtn) runBtn.disabled = false;
  if (incidentBtn) incidentBtn.disabled = false;
}

function setService(name, state, label) {
  const row = document.querySelector(`[data-service="${name}"]`);
  if (!row) return;
  row.classList.remove('warning', 'danger');
  if (state) row.classList.add(state);
  row.querySelector('strong').textContent = label;
}

function addIncidentEvent(label, text, cls = 'active') {
  const feed = document.querySelector('#incident-feed');
  if (!feed) return;
  const item = document.createElement('div');
  item.className = `feed-event ${cls}`;
  item.innerHTML = `<time>${label}</time><span>${text}</span>`;
  feed.appendChild(item);
  feed.scrollTop = feed.scrollHeight;
}

async function injectIncident() {
  if (incidentRunning || pipelineRunning) return;
  incidentRunning = true;
  if (incidentBtn) incidentBtn.disabled = true;
  if (runBtn) runBtn.disabled = true;
  const feed = document.querySelector('#incident-feed');
  if (feed) feed.innerHTML = '';
  const overall = document.querySelector('#overall-health');
  const status = document.querySelector('#incident-status');
  const latency = document.querySelector('#metric-latency');
  const errors = document.querySelector('#metric-errors');
  const replicas = document.querySelector('#metric-replicas');

  status?.classList.remove('idle');
  status?.classList.add('active');
  if (status) status.textContent = 'ACTIVE';
  if (labState) labState.textContent = 'INCIDENT DETECTED';

  setService('api', 'warning', 'Degraded');
  setService('observability', 'warning', 'Alerting');
  overall?.classList.remove('healthy');
  overall?.classList.add('warning');
  if (overall) overall.textContent = 'DEGRADED';
  if (latency) latency.textContent = '842 ms';
  if (errors) errors.textContent = '4.81%';
  addIncidentEvent('T+00s', 'Datadog detected elevated API latency.', 'error');
  await sleep(1100);
  addIncidentEvent('T+02s', 'BigPanda correlated alerts into a single incident.');
  await sleep(1100);
  setService('cluster', 'warning', 'Scaling');
  if (replicas) replicas.textContent = '6 → 10';
  addIncidentEvent('T+04s', 'Runbook triggered: scale application replicas.');
  await sleep(1200);
  addIncidentEvent('T+06s', 'Smoke check passed on recovered replicas.', 'complete');
  setService('cluster', '', 'Healthy');
  setService('api', '', 'Healthy');
  setService('observability', '', 'Active');
  if (latency) latency.textContent = '91 ms';
  if (errors) errors.textContent = '0.05%';
  if (replicas) replicas.textContent = '10 / 10';
  await sleep(900);
  overall?.classList.remove('warning');
  overall?.classList.add('healthy');
  if (overall) overall.textContent = 'HEALTHY';
  status?.classList.remove('active');
  status?.classList.add('idle');
  if (status) status.textContent = 'RESOLVED';
  addIncidentEvent('T+08s', 'Service recovered. Monitoring remains active.', 'complete');
  if (labState) labState.textContent = 'INCIDENT RESOLVED';
  incidentRunning = false;
  if (incidentBtn) incidentBtn.disabled = false;
  if (runBtn) runBtn.disabled = false;
}

runBtn?.addEventListener('click', runPipeline);
incidentBtn?.addEventListener('click', injectIncident);

const automationSection = document.querySelector('#automation');
let hasAutoRun = false;
if (automationSection && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting) && !hasAutoRun) {
      hasAutoRun = true;
      setTimeout(runPipeline, 450);
    }
  }, { threshold: 0.35 });
  observer.observe(automationSection);
}

async function fetchLiveDeploymentStatus() {
  const statusEl = document.querySelector('#github-run-status');
  try {
    const response = await fetch('https://api.github.com/repos/ohioze/DevOps/actions/runs?per_page=1', {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    const data = await response.json();
    const run = data.workflow_runs?.[0];
    if (!run) throw new Error('No workflow runs found');

    const result = run.status === 'completed' ? (run.conclusion || 'unknown') : run.status;
    if (statusEl) {
      statusEl.textContent = result.toUpperCase();
      statusEl.classList.remove('checking', 'healthy', 'warning', 'danger');
      statusEl.classList.add(result === 'success' ? 'healthy' : result === 'in_progress' || result === 'queued' ? 'warning' : 'danger');
    }
    const workflow = document.querySelector('#deploy-workflow');
    const runNo = document.querySelector('#deploy-run');
    const sha = document.querySelector('#deploy-sha');
    const time = document.querySelector('#deploy-time');
    if (workflow) workflow.textContent = run.name || 'GitHub Pages';
    if (runNo) runNo.textContent = `#${run.run_number}`;
    if (sha) sha.textContent = run.head_sha?.slice(0, 7) || '—';
    if (time) time.textContent = new Date(run.updated_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = 'UNAVAILABLE';
      statusEl.classList.remove('checking');
      statusEl.classList.add('warning');
    }
    const time = document.querySelector('#deploy-time');
    if (time) time.textContent = 'GitHub API temporarily unavailable';
  }
}

fetchLiveDeploymentStatus();
setInterval(fetchLiveDeploymentStatus, 60000);

function addWrappedText(doc, text, x, y, width, lineHeight = 4.2) {
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function generateResumePdf() {
  if (!window.jspdf?.jsPDF) {
    alert('The résumé generator is still loading. Please try again in a moment.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const left = 14;
  const right = 202;
  const width = right - left;
  let y = 16;
  const blue = [31, 78, 121];
  const dark = [30, 30, 30];

  function section(title) {
    y += 2.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...blue);
    doc.text(title.toUpperCase(), left, y);
    y += 2.2;
    doc.setDrawColor(...blue);
    doc.setLineWidth(0.35);
    doc.line(left, y, right, y);
    y += 5;
  }

  function body(text, size = 9.2) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...dark);
    y = addWrappedText(doc, text, left, y, width, 4.1) + 1.5;
  }

  function bullet(text) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.1);
    doc.setTextColor(...dark);
    doc.text('•', left + 2, y);
    const lines = doc.splitTextToSize(text, width - 7);
    doc.text(lines, left + 7, y);
    y += lines.length * 4.1 + 1;
  }

  function skill(text) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.9);
    doc.setTextColor(...dark);
    y = addWrappedText(doc, text, left, y, width, 3.9) + 1.2;
  }

  function role(title, date) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(title, left, y, { maxWidth: 140 });
    doc.setTextColor(...blue);
    doc.text(date, right, y, { align: 'right' });
    y += 5.2;
  }

  function pageFooter(page) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(95, 95, 95);
    doc.text('Page ' + page, right, 272, { align: 'right' });
  }

  // Page one header and links
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...blue);
  doc.text('JOHN ISEMEDE', 108, y, { align: 'center' });
  y += 6.5;
  doc.setFontSize(10.2);
  doc.setTextColor(90, 90, 90);
  doc.text('CLOUD DELIVERY ENGINEER | DEVOPS | CLOUD RELIABILITY', 108, y, { align: 'center' });
  y += 5.4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text('St. Louis, MO  |  682-727-7141', 108, y, { align: 'center' });
  y += 4.2;
  const links = [
    ['ohioisemede@gmail.com', 'mailto:ohioisemede@gmail.com'],
    ['LinkedIn', 'https://www.linkedin.com/in/john-isemede-/'],
    ['Portfolio', 'https://ohioze.github.io/DevOps/']
  ];
  const separators = ['  |  ', '  |  '];
  let totalWidth = 0;
  links.forEach((item, index) => {
    totalWidth += doc.getTextWidth(item[0]);
    if (index < separators.length) totalWidth += doc.getTextWidth(separators[index]);
  });
  let linkX = 108 - totalWidth / 2;
  for (let i = 0; i < links.length; i++) {
    const [label, url] = links[i];
    const linkWidth = doc.getTextWidth(label);
    doc.setTextColor(...blue);
    doc.text(label, linkX, y);
    doc.link(linkX, y - 3.2, linkWidth, 4, { url });
    linkX += linkWidth;
    if (i < separators.length) {
      doc.setTextColor(...dark);
      doc.text(separators[i], linkX, y);
      linkX += doc.getTextWidth(separators[i]);
    }
  }
  y += 3;

  section('Professional Summary');
  body('Cloud Delivery Engineer with hands-on experience building and supporting AWS infrastructure, delivery automation, and production operations. Solely owned an assigned work deliverable from infrastructure and automation through pre-production validation, testing, and production deployment. Experienced with Terraform, Ansible, GitLab CI/CD, Python and Bash, observability, security controls, and release validation in financial services environments.');

  section('Technical Expertise');
  [
    'Cloud Platforms: AWS, Microsoft Azure, AWS Outposts, EC2, VPC, IAM, Systems Manager, CloudWatch, Azure Application Insights, hybrid cloud infrastructure',
    'Infrastructure as Code: Terraform, AWS CloudFormation, Ansible, reusable provisioning patterns, configuration automation, environment standardization',
    'DevSecOps and CI/CD: GitLab CI/CD, Jenkins, GitHub Actions, automated build, test, deployment and validation workflows, release readiness, change management',
    'Automation: Python, Boto3, Bash, PowerShell, YAML, cloud provisioning, deployment automation, patching, compliance and recurring operations',
    'Containers and Platforms: Docker, Kubernetes, Amazon EKS, NGINX, Linux, Windows Server, networking, secure connectivity',
    'Security and Observability: IAM, least privilege, TLS, vulnerability remediation, SOC 2 aligned practices, Datadog, Prometheus, Grafana, ELK, BigPanda'
  ].forEach(skill);

  section('Professional Experience');
  role('LSEG | Senior Associate DevOps Engineer', 'Jul 2025 – Present');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.8);
  doc.setTextColor(90, 90, 90);
  doc.text('St. Louis, Missouri', left, y);
  y += 4.5;
  [
    'Solely owned an assigned work deliverable end to end, taking it from infrastructure and automation through pre-production validation, testing, and production deployment.',
    'Build and support AWS infrastructure using Terraform and Ansible, with changes validated through controlled delivery and operational procedures.',
    'Develop and maintain GitLab CI/CD workflows with review and validation steps that support repeatable releases and production readiness.',
    'Automate cloud operations, patching, and compliance reporting with Python, Boto3, Bash, and related infrastructure tooling.',
    'Build Datadog monitors, dashboards, and alerts integrated with AWS monitoring and incident management signals to support troubleshooting and operational response.',
    'Support cloud and platform operations across EC2, Systems Manager, AWS Outposts, IAM, Linux, Kubernetes, secure connectivity, and TLS.',
    'Contribute to migration of enterprise scheduling workloads from on-premises infrastructure to AWS, supporting rollout and connectivity troubleshooting.'
  ].forEach(bullet);
  pageFooter(1);

  // Page two keeps the Cloud Delivery Engineer template's running header and page number.
  doc.addPage();
  y = 17;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(90, 90, 90);
  doc.text('JOHN ISEMEDE  |  CLOUD DELIVERY ENGINEER', right, y, { align: 'right' });
  y += 12;

  section('Selected Delivery Highlights');
  body('Examples of assigned platform work, described without internal system names or operational identifiers.', 9);
  [
    'Solely owned the assigned work deliverable through infrastructure setup, automation, pre-production validation, testing, and production deployment.',
    'Improved delivery controls by adding automated review and security checks to software change workflows.',
    'Standardized monitoring configuration through reusable infrastructure code for cloud service alerts.',
    'Automated recurring cloud compliance reporting and organized results for operational review.',
    'Troubleshot secure session access for hybrid cloud infrastructure and improved the reliability of support procedures.',
    'Supported controlled machine image patching through non-production validation and production readiness steps.',
    'Contributed to migration of enterprise scheduling workloads to AWS and helped resolve connectivity issues during rollout.'
  ].forEach(bullet);

  section('Education');
  role('University of Salford | B.Eng., Aerospace / Aeronautical Engineering', 'Sep 2014 – Jul 2018');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.8);
  doc.setTextColor(90, 90, 90);
  doc.text('Salford, United Kingdom', left, y);
  y += 5.5;
  role('Pima Community College | A.A.S., Airframe Mechanics', 'Aug 2021 – Dec 2021');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.8);
  doc.setTextColor(90, 90, 90);
  doc.text('Tucson, Arizona', left, y);
  y += 5.5;

  section('Certifications and Training');
  [
    'AWS: AWS Certified Solutions Architect – Associate, 2026',
    'Information Security: Computer Information Technology Information Security Certificate, Dallas College, Dec 2023',
    'Additional Training: Git for Developers, KodeKloud, Sep 2024; Cisco Networking Certification Course, Oct 2022'
  ].forEach(skill);

  pageFooter(2);
  doc.save('John_Isemede_Cloud_Delivery_Engineer_Resume.pdf');
}

document.querySelectorAll('.resume-download').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    generateResumePdf();
  });
});

// Aviation story remains text-only in the final layout.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reducedMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-ready');

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.prepend(progress);

  const updateScrollProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    progress.style.setProperty('--scroll-progress', ratio.toFixed(4));
  };

  updateScrollProgress();
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });

  const revealGroups = [
    '.section-heading',
    '.hero-stats article',
    '.impact-grid > article',
    '.automation-topbar',
    '.pipeline-card',
    '.automation-grid > article',
    '.project-row',
    '.stack-grid > article',
    '.timeline-item',
    '.aviation-story-card',
    '.education-grid > article',
    '.journey-card',
    '.journey-note',
    '.principles-grid > blockquote',
    '.contact-section'
  ];

  const revealItems = [...document.querySelectorAll(revealGroups.join(','))];
  revealItems.forEach((item, index) => {
    item.classList.add('scroll-reveal');
    item.dataset.reveal = index % 2 === 0 ? 'left' : 'right';

    const siblings = item.parentElement
      ? [...item.parentElement.children].filter(child => revealItems.includes(child))
      : [];
    const siblingIndex = Math.max(0, siblings.indexOf(item));
    item.style.setProperty('--reveal-delay', `${Math.min(siblingIndex * 75, 300)}ms`);
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.14,
    rootMargin: '0px 0px -8% 0px'
  });

  revealItems.forEach(item => revealObserver.observe(item));
}

