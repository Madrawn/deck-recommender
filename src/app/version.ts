import version from './version.json'

export interface AppVersion {
  FullSemVer: string
  Major: number
  Minor: number
  Patch: number
  CommitDate: string
  Sha: string
}

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
