import logger from './logger';
import path from 'path';
import { fs, system } from 'appium-support';
import { exec } from 'teen_process';

function formatBinary (binary) {
  return system.isWindows() ? binary + ".exe" : binary;
}

function pathChecks () {   
  let javaHome = process.env.JAVA_HOME;
  let androidHome = process.env.ANDROID_HOME;

  if (typeof javaHome === 'undefined') {
    logger.error(`${javaHome} is NOT set!`);
  } 
  
  if (typeof androidHome === 'undefined') {
    logger.error(`${androidHome} is NOT set!`);
  } 
}

function binaryChecks () {
  // Java Check    
  let javaPath = path.resolve(process.env.JAVA_HOME, formatBinary('java'));    
  fs.exists(javaPath) ? logger.info(`java exists at: ${javaPath}`) : logger.error(`java could NOT be found at \'${javaPath}\'!`);

  // Android Stuff
  let adbPath = path.resolve(process.env.ANDROID_HOME, path.join("platform-tools", formatBinary('adb')));    
  fs.exists(adbPath) ? logger.info(`adb exists at: ${adbPath}`) : logger.error(`adb could NOT be found at \'${adbPath}\'!`);

  let androidPath = path.resolve(process.env.ANDROID_HOME, path.join("tools", system.isWindows() ? 'android.bat' : 'android'));
  fs.exists(androidPath) ? logger.info(`android exists at: ${androidPath}`) : logger.error(`android could NOT be found at \'${androidPath}\'!`); 
    
  let androidEmulatorPath = path.resolve(process.env.ANDROID_HOME, path.join("tools", formatBinary('emulator')));
  fs.exists(androidEmulatorPath) ? logger.info(`emulator exists at: ${androidEmulatorPath}`) : logger.error(`emulator could NOT be found at \'${androidEmulatorPath}\'!`); 

  // IOS stuff
  if (system.isMac()) {
    carthageCheck();
    xcodeCheck();
    xcodeCommandLineToolsCheck();
    DevToolsSecurityCheck();
    authDbCheck();
  }   
}

async function carthageCheck () {
  let stdout;
  try {
    stdout = (await exec('which', ['carthage'])).stdout;
    let carthagePath = stdout.replace("\n", "");
    if (await fs.exists(carthagePath)) {
      logger.info(`Carthage was found at: ${carthagePath}`);
      return carthagePath;
    }
  } catch (ign) {
    logger.warn('Carthage is not installed');
  } 
}

async function xcodeCheck () {
  let xcodePath;
  try {
    let {stdout} = await exec('xcode-select', ['--print-path']);
    xcodePath = (stdout || '').replace("\n", "");
  } catch (err) {
    return logger.error('Xcode is NOT installed!');
  }
  return xcodePath && await fs.exists(xcodePath) ? logger.info(`Xcode is installed at: ${xcodePath}`) :
    logger.error(`Xcode cannot be found at \'${xcodePath}\'!`);
}

async function xcodeCommandLineToolsCheck () {
  const errMessage = 'Xcode Command Line Tools are NOT installed. The following command need be executed: xcode-select --install';
  let pkgName = 'com.apple.pkg.CLTools_Executables';
  let stdout;
  try {
    stdout = (await exec('pkgutil', [`--pkg-info=${pkgName}`])).stdout;
  } catch (err) {
    logger.error(errMessage);
  }
  return stdout.match(/install-time/) ? logger.info('Xcode Command Line Tools are installed.') :
    logger.error(errMessage);
}

async function DevToolsSecurityCheck () {
  const errMess = 'DevToolsSecurity is NOT enabled!';
  let stdout;
  try {
    stdout = (await exec('DevToolsSecurity', [])).stdout;
  } catch (err) {
    logger.error(err);    
  }
  return stdout && stdout.match(/enabled/) ? logger.info('DevToolsSecurity is enabled.')
    : logger.error(errMess);
}  

async function authDbCheck () {
  const successMess = 'The Authorization DB is set up properly.';
  const errMess = 'The Authorization DB is NOT set up properly.';
  let stdout;
  try {
    stdout = (await exec('security', ['authorizationdb', 'read', 'system.privilege.taskport'])).stdout;
  } catch (err) {
    logger.error(errMess);
  }  
  return stdout && (stdout.match(/is-developer/) || stdout.match(/allow/)) ?
      logger.info(successMess) : logger.error(errMess);
}

export { pathChecks, binaryChecks };



