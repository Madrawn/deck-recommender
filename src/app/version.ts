import { AppVersion } from './types'
import version from './version.json'

export const getVersion = (): AppVersion => {
  try {
    return version
  } catch {
    return {
      FullSemVer: 'dev',
      Major: 0,
      Minor: 0,
      Patch: 0,
      CommitDate: new Date().toISOString(),
      Sha: 'local'
    }
  }
}
