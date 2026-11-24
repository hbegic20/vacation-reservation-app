import { VacationRequest } from '@vacation/shared';

export function requesterName(request: VacationRequest): string {
  return request.user ? `${request.user.firstName} ${request.user.lastName}` : 'Unknown employee';
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
