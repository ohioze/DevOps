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

function addWrappedText(doc, text, x, y, width, lineHeight = 4.5) {
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
  const width = 188;
  let y = 15;

  const section = title => {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(title.toUpperCase(), left, y);
    y += 2;
    doc.setDrawColor(70);
    doc.line(left, y, 202, y);
    y += 5;
  };

  const bullet = text => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize('• ' + text, width - 2);
    doc.text(lines, left + 2, y);
    y += lines.length * 4 + 1;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('JOHN ISEMEDE', left, y);
  y += 7;
  doc.setFontSize(10.5);
  doc.text('SENIOR DEVOPS ENGINEER | CLOUD, CI/CD, AUTOMATION & PRODUCTION RELIABILITY', left, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('St. Louis, MO | LinkedIn: linkedin.com/in/john-isemede-/ | GitHub: github.com/ohioze', left, y);
  y += 4.5;
  doc.text('Portfolio: ohioze.github.io/DevOps/', left, y);
  y += 6;

  section('Professional Summary');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  y = addWrappedText(doc, 'Senior DevOps Engineer with nearly 8 years of experience improving cloud infrastructure, CI/CD, deployment automation, production reliability, observability, security, and operational standards across enterprise environments. Hands on with AWS, Azure, Terraform, Ansible, GitLab CI/CD, GitHub Actions, Jenkins, Docker, Kubernetes, NGINX, TLS, Windows Server, PowerShell, Python, Bash, Linux, Datadog, Prometheus, Grafana, and Azure Application Insights.', left, y, width, 4.2) + 2;

  section('Core Technical Skills');
  const skills = [
    ['Cloud & Infrastructure', 'AWS, Azure, AWS Outposts, EC2, VPC, IAM, Systems Manager, CloudWatch, Azure Application Insights'],
    ['CI/CD & Release Engineering', 'GitLab CI/CD, GitHub Actions, Jenkins, deployment pipelines, release management, change readiness, production validation'],
    ['Infrastructure as Code & Automation', 'Terraform, Ansible, CloudFormation, Python, Bash, PowerShell, YAML'],
    ['Containers & Platforms', 'Docker, Kubernetes, Amazon EKS, NGINX, containerized deployments'],
    ['Observability & Reliability', 'Datadog, Prometheus, Grafana, ELK, CloudWatch, BigPanda, incident response, RCA'],
    ['Security & Operations', 'IAM, least privilege, TLS, SSH, SOC 2 aligned operations, vulnerability remediation, Linux, Windows Server, RDP']
  ];
  skills.forEach(([k,v]) => {
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.text(k + ':', left, y);
    doc.setFont('helvetica','normal');
    y = addWrappedText(doc, v, left + 42, y, width - 42, 4) + 1;
  });

  section('Professional Experience');
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('LSEG — DevOps Engineer', left, y); doc.text('Jul 2025 – Present', 164, y); y += 5;
  [
    'Own and support DevOps and production operations for business critical financial platforms.',
    'Led Price Stream scheduling migration from on premises Rundeck to AWS Rundeck Enterprise across Development, QA, Pre Production, and Production.',
    'Build and maintain Terraform Infrastructure as Code and automation using Ansible, Python, Bash, and PowerShell.',
    'Build and support GitLab CI/CD pipelines, release readiness, deployment validation, and operational runbooks.',
    'Build Datadog dashboards and alerts integrated with CloudWatch, AWS Health, BigPanda, and Azure Application Insights.',
    'Support production incident response, root cause analysis, corrective actions, patching, vulnerability remediation, secure connectivity, SSH, TLS, and IAM least privilege controls.'
  ].forEach(bullet);

  if (y > 235) { doc.addPage(); y = 15; }
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('NoroTech — DevOps Engineer, Client: American Express', left, y); doc.text('Aug 2018 – Jul 2025', 164, y); y += 5;
  [
    'Supported AWS and Azure cloud infrastructure and hybrid environments.',
    'Built and maintained CI/CD workflows using GitLab, Jenkins, and GitHub Actions.',
    'Automated infrastructure and configuration with Terraform and Ansible.',
    'Used Python, Bash, and PowerShell across Linux and Windows operational environments.',
    'Worked with Docker, Kubernetes, NGINX, TLS, networking, Datadog, Prometheus, Grafana, ELK, and Application Insights.',
    'Supported IAM, least privilege, vulnerability remediation, SOC 2 aligned practices, release consistency, runbooks, and production resilience.'
  ].forEach(bullet);

  section('Education');
  doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text('Bachelor of Engineering, Aerospace / Aeronautical Engineering', left, y); y += 4;
  doc.setFont('helvetica','normal'); doc.text('The University of Salford, Manchester, UK', left, y); y += 5;
  doc.setFont('helvetica','bold'); doc.text('Associate of Applied Science, Cybersecurity', left, y); y += 4;
  doc.setFont('helvetica','normal'); doc.text('Dallas College', left, y); y += 5;
  doc.setFont('helvetica','bold'); doc.text('Associate of Applied Science, Airframe Mechanics and Aircraft Maintenance Technology', left, y); y += 4;
  doc.setFont('helvetica','normal'); doc.text('Pima Community College', left, y);

  doc.save('John_Isemede_Senior_DevOps_Resume.pdf');
}

document.querySelectorAll('.resume-download').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    generateResumePdf();
  });
});

// Aviation media refresh: keep the footage short, focused, and visually polished.
const aviationFeatureGrid = document.querySelector('#aviation .aviation-feature-grid');
if (aviationFeatureGrid) {
  const storyCard = aviationFeatureGrid.querySelector('.aviation-story-card');
  const storyMarkup = storyCard ? storyCard.outerHTML : '';

  aviationFeatureGrid.innerHTML = `
    <article class="aviation-video-card aviation-video-featured">
      <div class="aviation-video-head">
        <div>
          <p class="card-kicker">FIELD FOOTAGE · MAINTENANCE</p>
          <h3>Nose wheel maintenance sequence</h3>
        </div>
        <span class="video-chip">5 SEC LOOP</span>
      </div>
      <video class="aviation-video aviation-video-enhanced" src="95601bc09092453a8a82300157ebdbb0.MOV" controls muted loop playsinline preload="metadata"></video>
      <p class="video-note">Real aviation maintenance footage from my earlier aircraft engineering work.</p>
    </article>

    <article class="aviation-video-card">
      <div class="aviation-video-head">
        <div>
          <p class="card-kicker">FIELD FOOTAGE · HANGAR</p>
          <h3>Aircraft maintenance environment</h3>
        </div>
        <span class="video-chip">4.8 SEC LOOP</span>
      </div>
      <video class="aviation-video aviation-video-enhanced aviation-short-loop" src="D7A5F849-BD7A-4C34-ABEF-04241A34E547.MP4" controls muted playsinline preload="metadata" data-loop-end="4.8"></video>
      <p class="video-note">A concise look inside the hangar environment where inspection, troubleshooting, and maintenance discipline were everyday operations.</p>
    </article>

    ${storyMarkup}
  `;

  const shortLoopVideo = aviationFeatureGrid.querySelector('.aviation-short-loop');
  if (shortLoopVideo) {
    const loopEnd = Number(shortLoopVideo.dataset.loopEnd || 4.8);
    shortLoopVideo.addEventListener('timeupdate', () => {
      if (shortLoopVideo.currentTime >= loopEnd) {
        shortLoopVideo.currentTime = 0;
        shortLoopVideo.play().catch(() => {});
      }
    });
    shortLoopVideo.addEventListener('ended', () => {
      shortLoopVideo.currentTime = 0;
      shortLoopVideo.play().catch(() => {});
    });
  }
}
