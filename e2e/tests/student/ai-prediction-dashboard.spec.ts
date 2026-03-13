import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { AIPredictionPage } from '../../page-objects/AIPredictionPage';
import { TEST_USERS, TEST_AI_PREDICTION_DATA } from '../../fixtures/test-data';
import { waitForNetworkIdle } from '../../utils/helpers';

test.describe('AI Prediction Dashboard - What-If Scenarios', () => {
  let loginPage: LoginPage;
  let predictionPage: AIPredictionPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    predictionPage = new AIPredictionPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
    await waitForNetworkIdle(page);
    
    await predictionPage.goto();
  });

  test('should display AI prediction dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/ai-prediction/);
    await expect(page.locator('h1')).toContainText(/ai prediction/i);
  });

  test('should load prediction chart', async () => {
    await predictionPage.waitForChartLoad();
    
    await expect(predictionPage.predictionChart).toBeVisible();
  });

  test('should open what-if scenario modal', async () => {
    await predictionPage.openWhatIfScenario();
    
    await expect(predictionPage.subjectSelect).toBeVisible();
    await expect(predictionPage.targetScoreInput).toBeVisible();
  });

  test('should add and run what-if scenario', async ({ page }) => {
    const { subject, targetScore } = TEST_AI_PREDICTION_DATA.whatIfScenarios[0];
    
    await predictionPage.addWhatIfScenario(subject, targetScore);
    
    const scenarioAdded = page.locator('[data-testid="scenario-item"]', {
      hasText: subject,
    });
    await expect(scenarioAdded).toBeVisible();
    
    await predictionPage.runPrediction();
    
    await expect(predictionPage.scenarioResults).toBeVisible();
  });

  test('should add multiple what-if scenarios', async ({ page }) => {
    for (const scenario of TEST_AI_PREDICTION_DATA.whatIfScenarios) {
      await predictionPage.addWhatIfScenario(scenario.subject, scenario.targetScore);
    }
    
    const scenariosCount = await page.locator('[data-testid="scenario-item"]').count();
    expect(scenariosCount).toBe(TEST_AI_PREDICTION_DATA.whatIfScenarios.length);
  });

  test('should display prediction confidence level', async ({ page }) => {
    await predictionPage.waitForChartLoad();
    
    const confidenceLevel = page.locator('[data-testid="confidence-level"]');
    await expect(confidenceLevel).toBeVisible();
    
    const confidenceText = await confidenceLevel.textContent();
    expect(confidenceText).toMatch(/\d+%/);
  });

  test('should show subject-wise predictions', async ({ page }) => {
    await predictionPage.waitForChartLoad();
    
    for (const subject of TEST_AI_PREDICTION_DATA.subjects) {
      const subjectCard = page.locator('[data-testid="subject-prediction"]', {
        hasText: subject,
      });
      await expect(subjectCard).toBeVisible();
    }
  });

  test('should export prediction report', async ({ page }) => {
    await predictionPage.waitForChartLoad();
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      predictionPage.exportButton.click(),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/prediction/i);
  });

  test('should update prediction based on recent performance', async ({ page }) => {
    const updateButton = page.locator('button', { hasText: /update/i });
    await updateButton.click();
    
    await waitForNetworkIdle(page);
    
    const lastUpdated = page.locator('[data-testid="last-updated"]');
    await expect(lastUpdated).toBeVisible();
  });

  test('should display recommended study plan', async ({ page }) => {
    await predictionPage.waitForChartLoad();
    
    const studyPlanSection = page.locator('[data-testid="recommended-plan"]');
    await expect(studyPlanSection).toBeVisible();
  });

  test('should validate target score input', async ({ page }) => {
    await predictionPage.openWhatIfScenario();
    
    await predictionPage.subjectSelect.selectOption('Mathematics');
    await predictionPage.targetScoreInput.fill('150');
    
    await predictionPage.addScenarioButton.click();
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
  });
});
