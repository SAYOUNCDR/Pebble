import { JobModel, type JobStatus } from "./model.js";

export async function setJobStatus(queueJobId: string, status: JobStatus, extra?: Partial<{ checklistId: string; errorMessage: string }>): Promise<void> {
    await JobModel.updateOne(
        { queueJobId },
        {
            $set: {
                status,
                ...(extra?.checklistId ? { checklistId: extra.checklistId } : {}),
                ...(extra?.errorMessage ? { errorMessage: extra.errorMessage } : {}),
            },
        },
    );
}
