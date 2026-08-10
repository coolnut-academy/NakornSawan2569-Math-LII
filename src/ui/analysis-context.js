export function getAnalysisElement(root, id) {
  return root?.querySelector(`[data-analysis-id="${id}"]`) || null;
}

function markAnalysisElements(root) {
  root.querySelectorAll('[id]').forEach((element) => {
    element.dataset.analysisId ||= element.id;
  });
}

export function mountAnalysisInstances(presetRoot, liveRoot) {
  if (!presetRoot || !liveRoot) return;

  markAnalysisElements(presetRoot);
  liveRoot.innerHTML = presetRoot.innerHTML;
  markAnalysisElements(liveRoot);

  liveRoot.querySelectorAll('[data-analysis-id]').forEach((element) => {
    element.id = `live-${element.dataset.analysisId}`;
  });
  liveRoot.querySelectorAll('[for]').forEach((label) => {
    label.htmlFor = `live-${label.htmlFor}`;
  });
  liveRoot.querySelectorAll('[data-guide-toggle]').forEach((button) => {
    button.dataset.guideToggle = `live-${button.dataset.guideToggle}`;
  });
  liveRoot.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.href = `#live-${link.getAttribute('href').slice(1)}`;
  });

  presetRoot.querySelector('[data-analysis-title]')?.replaceChildren('ผลวิเคราะห์ Preset');
  liveRoot.querySelector('[data-analysis-title]')?.replaceChildren('ผลวิเคราะห์ Live Studio');
}
