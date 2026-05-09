import './index.css';
import './shared/sidekick-api';

const appInfoTarget = document.querySelector<HTMLSpanElement>('[data-app-info]');

if (window.sidekick) {
  window.sidekick.getAppInfo().then((info) => {
    if (appInfoTarget) {
      appInfoTarget.textContent = `${info.name} ${info.version} / ${info.platform}`;
    }
  });
} else if (appInfoTarget) {
  appInfoTarget.textContent = 'Browser preview';
}
