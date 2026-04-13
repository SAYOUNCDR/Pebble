const ACTIVE_TEAM_KEY = 'pebble.active.teamId'

export function getActiveTeamId(): string | null {
    const value = localStorage.getItem(ACTIVE_TEAM_KEY)
    if (!value) {
        return null
    }
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : null
}

export function setActiveTeamId(teamId: string | null): void {
    if (!teamId || teamId.trim().length === 0) {
        localStorage.removeItem(ACTIVE_TEAM_KEY)
        return
    }
    localStorage.setItem(ACTIVE_TEAM_KEY, teamId.trim())
}
