import { apiRequest } from '../../lib/http'

export interface TeamSummary {
    teamId: string
    name: string
    ownerUserId: string
    role: 'owner' | 'member'
    createdAt: string
    updatedAt: string
}

export const teamsApi = {
    listTeams: (token: string) =>
        apiRequest<{ teams: TeamSummary[] }>('/api/teams', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        }),
}
