export class AssertionError extends Error {
  constructor(message: string) {
    super(`Assertion error: ${message}`);
  }
}

export enum SlippyErrorCode {
  Generic = "SLIPPY_GENERIC_ERROR",
  FileNotFound = "SLIPPY_FILE_NOT_FOUND",
  ConfigNotFound = "SLIPPY_CONFIG_NOT_FOUND",
  SlippyRuleNotRegistered = "SLIPPY_RULE_NOT_REGISTERED",
  SlippyConfigAlreadyExists = "SLIPPY_CONFIG_ALREADY_EXISTS",
  SlippyUnmatchedPattern = "SLIPPY_UNMATCHED_PATTERN",
  SlippyDirectoriesNotSupported = "SLIPPY_DIRECTORIES_NOT_SUPPORTED",
  SlippyCantInferSolidityVersion = "SLIPPY_CANT_INFER_SOLIDITY_VERSION",
  SlippyErrorLoadingConfig = "SLIPPY_ERROR_LOADING_CONFIG",
  SlippyInvalidConfig = "SLIPPY_INVALID_CONFIG",
}

export class SlippyError extends Error {
  private isSlippyError = true;

  constructor(
    public message: string,
    public code: SlippyErrorCode = SlippyErrorCode.Generic,
    public hint?: string,
  ) {
    super(message);
  }

  public static isSlippyError(error: unknown): error is SlippyError {
    return (
      error instanceof Error && (error as SlippyError).isSlippyError === true
    );
  }
}

export class SlippyFileNotFoundError extends SlippyError {
  constructor(fileId: string) {
    super(`File not found: ${fileId}`);
    this.code = SlippyErrorCode.FileNotFound;
  }
}

export class SlippyConfigNotFoundError extends SlippyError {
  constructor() {
    super(
      "No slippy.config.js found in the current directory or any parent directory",
    );
    this.code = SlippyErrorCode.ConfigNotFound;
    this.hint = "Run 'slippy --init' to create a configuration file.";
  }
}

export class SlippyRuleNotRegisteredError extends SlippyError {
  constructor(ruleName: string) {
    super(`Rule '${ruleName}' does not exist`);
    this.code = SlippyErrorCode.SlippyRuleNotRegistered;
  }
}

export class SlippyConfigAlreadyExistsError extends SlippyError {
  constructor(configPath: string) {
    super(`Configuration file already exists at '${configPath}'`);
    this.code = SlippyErrorCode.SlippyConfigAlreadyExists;
  }
}

export class SlippyUnmatchedPatternError extends SlippyError {
  constructor(pattern: string) {
    super(`No files matched the pattern: '${pattern}'`);
    this.code = SlippyErrorCode.SlippyUnmatchedPattern;
  }
}

export class SlippyDirectoriesNotSupportedError extends SlippyError {
  constructor(directory: string) {
    super(`Directories are not supported: '${directory}'`);
    this.code = SlippyErrorCode.SlippyDirectoriesNotSupported;
  }
}

export class SlippyCantInferSolidityVersionError extends SlippyError {
  constructor(sourceId: string) {
    super(`Cannot infer Solidity version for source file: ${sourceId}`);
    this.code = SlippyErrorCode.SlippyCantInferSolidityVersion;
    this.hint =
      "Check that the version pragmas are correct and that you are using the latest version of Slippy.";
  }
}

export class SlippyConfigLoadingError extends SlippyError {
  constructor(slippyConfigPath: string, message: string) {
    super(`Error loading config at '${slippyConfigPath}': ${message}`);
    this.code = SlippyErrorCode.SlippyErrorLoadingConfig;
  }
}

export class SlippyInvalidConfigError extends SlippyError {
  constructor(slippyConfigPath: string, message: string, hint?: string) {
    super(`Invalid config at '${slippyConfigPath}': ${message}`);
    this.code = SlippyErrorCode.SlippyInvalidConfig;
    this.hint = hint;
  }
}
