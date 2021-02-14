const config = require('config');
const Bot = require('../../framework/bot');
const { generateEmail, generatePassword } = require('../../framework/utils');
const LoginPage = require('../../pages/login');
const DashboardPage = require('../../pages/dashboard');
const TestPage = require('../../pages/testerCallback');
const { ConnectionsSection, UsersSection } = DashboardPage.sections;

if (!config.has('login.email') || !config.has('login.password')) {
  throw new Error('Please set credentials in .env');
}

const LOGIN_EMAIL = config.get('login.email');
const LOGIN_PASSWORD = config.get('login.password');
// const NEW_USER_EMAIL = config.has('users.newUser.email') ? config.get('users.newUser.email') : null;
// const NEW_USER_PASSWORD = config.has('users.newUser.password') ? config.get('users.newUser.password') : null;

let bot, browser;
describe('Users', () => {
  beforeAll(async () => {
    browser = global.browser;
    bot = new Bot(browser, global.page);
    await handleLogin({
      bot,
      url: LoginPage.url,
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
      nextPageSelector: DashboardPage.selector
    });
    await bot.checkTitle(expect, DashboardPage.title);
  });

  afterEach(async () => {
    await bot.resetPages();
    // todo: clean slate between tests
  });

  describe('new user modal', () => {
    let modal;
    beforeEach(async () => {
      modal = await viewCreateUsersModal();
    });

    test('passwords must match', async () => {
      await bot.type(modal.emailInput, 'alice@example.com');
      await bot.type(modal.passwordInput, 'super%%SECURE%%21');
      await bot.type(modal.repeatPasswordInput, 'something%%different00');
      await bot.click(modal.submitButton);
      // this implicitly confirms there was an error.
      const modalStillVisible = await bot.isVisible(modal);
      expect(modalStillVisible).toBe(true);
      // it would be better to check that the error is shown in the UI
    });

    test('create user modal can be dismissed by keyboard', async () => {
      expect(await bot.isVisible(modal)).toBe(true);
      await bot.sendKey('Escape');
      expect(await bot.isVisible(modal)).toBe(false);
    });

    test('create user modal can be dismissed by close button', async () => {
      expect(await bot.isVisible(modal)).toBe(true);
      await bot.click(modal.closeButton);
      expect(await bot.isVisible(modal)).toBe(false);
    });

    test('input validation of various fields'); // todo
    test('use email for a user that already exists'); // todo
  });

  describe('creating a new user', () => {
    const newEmail = generateEmail(LOGIN_EMAIL);
    const newPassword = generatePassword();

    beforeAll(async () => {
      await viewDashboard();
      await createUser(newEmail, newPassword);
    });

    // yes this one is dependent on execution order which we should change:
    test('new user is shown as `pending` until first login', async () => {
      const { userEmailVerified } = UsersSection.userDetails;
      expect(await bot.getTextContent(userEmailVerified)).toContain('pending');
    });

    test('new user can log into default connection', async () => {
      await viewDatabases();
      const newPage = await bot.newPageAfter(() => bot.clickByText(ConnectionsSection.database.list.tryButton));
      const newBot = new Bot(browser, newPage);
      await handleLogin({
        bot: newBot,
        email: newEmail,
        password: newPassword,
        nextPageSelector: TestPage.userInfo.selector
      });
      const userInfo = await newBot.getTextContent(TestPage.userInfo);
      const header = await newBot.getTextContent(TestPage.header);
      expect(userInfo).toContain(newEmail);
      expect(header).toContain(TestPage.SUCCESS_MESSAGE);
    });

    test('can create user with different connection types'); // todo
    test('new user can request token'); // todo
    test('given some rule, new user can request token and appropriate scopes are applied'); // todo
  });

  describe('existing users', () => {
    test('change user password'); // todo
    test('delete user'); // todo
  });
});

/** Helper functions */
async function handleLogin({ bot, email, password, url, nextPageSelector }) {
  if (url) {
    await bot.goto(url);
  }
  await bot.type(LoginPage.emailInput, email);
  await bot.type(LoginPage.passwordInput, password);
  await bot.click(LoginPage.submitButton);
  if (nextPageSelector) {
    await bot.waitForVisible(nextPageSelector);
  }
  return bot;
}

async function viewDashboard() {
  await bot.ensureUrl(DashboardPage.url);
  await bot.checkElement(expect, DashboardPage.selector, DashboardPage.title);
  await bot.checkTitle(expect, DashboardPage.title);
  return DashboardPage;
}

async function viewCreateUsersModal() {
  await bot.ensureUrl(DashboardPage.url);
  await bot.clickByText(DashboardPage.userButton);
  await bot.waitForVisible(UsersSection.selector);
  await bot.checkTitle(expect, UsersSection.title);
  await bot.clickByText(UsersSection.createFirstButton);

  const modal = UsersSection.createUserModal;
  await bot.checkElement(expect, modal.selector, modal.title);
  return modal;
}

async function createUser(newEmail, newPassword) {
  const modal = await viewCreateUsersModal();
  await bot.type(modal.emailInput, newEmail);
  await bot.type(modal.passwordInput, newPassword);
  await bot.type(modal.repeatPasswordInput, newPassword);
  await bot.click(modal.submitButton);

  const details = UsersSection.userDetails;
  await bot.checkElement(expect, details.userHeadEmail, newEmail);
  await bot.checkElement(expect, details.userEmail, newEmail);
  return details;
}

async function viewDatabases() {
  await bot.ensureUrl(DashboardPage.url);
  const { database } = ConnectionsSection;
  const databaseButtonShown = await bot.isVisibleContainingText(DashboardPage.databaseButton);
  if (!databaseButtonShown) {
    await bot.clickByText(DashboardPage.connectionsButton);
  }
  await bot.clickByText(DashboardPage.databaseButton);
  await bot.checkElement(expect, database.selector, database.title);
  return database;
}