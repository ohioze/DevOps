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
