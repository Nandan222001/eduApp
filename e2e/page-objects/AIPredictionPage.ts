import { Page, Locator } from '@playwright/test';

export class AIPredictionPage {
  readonly page: Page;
  readonly predictionChart: Locator;
  readonly whatIfButton: Locator;
  readonly subjectSelect: Locator;
  readonly targetScoreInput: Locator;
  readonly addScenarioButton: Locator;
  readonly runPredictionButton: Locator;
  readonly scenarioResults: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.predictionChart = page.locator('[data-testid="prediction-chart"]');
    this.whatIfButton = page.locator('button', { hasText: /what-if/i });
    this.subjectSelect = page.locator('select[name="subject"]');
    this.targetScoreInput = page.locator('input[name="targetScore"]');
    this.addScenarioButton = page.locator('button', { hasText: /add scenario/i });
    this.runPredictionButton = page.locator('button', { hasText: /run prediction/i });
    this.scenarioResults = page.locator('[data-testid="scenario-results"]');
    this.exportButton = page.locator('button', { hasText: /export/i });
  }

  async goto() {
    await this.page.goto('/student/ai-prediction');
  }

  async waitForChartLoad() {
    await this.predictionChart.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(1000);
  }

  async openWhatIfScenario() {
    await this.whatIfButton.click();
  }

  async addWhatIfScenario(subject: string, targetScore: number) {
    await this.openWhatIfScenario();
    await this.subjectSelect.selectOption(subject);
    await this.targetScoreInput.fill(targetScore.toString());
    await this.addScenarioButton.click();
  }

  async runPrediction() {
    await this.runPredictionButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getScenarioResult(scenarioIndex: number): Promise<string> {
    const result = this.scenarioResults.locator('.scenario-item').nth(scenarioIndex);
    return (await result.textContent()) || '';
  }
}
