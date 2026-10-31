import { opportunityApi } from './api';

// A deal can come from any server page; mutation must not depend on dashboard state.
export async function confirmDealSold(
  id: string,
  payload: Parameters<typeof opportunityApi.markSold>[1],
  request = opportunityApi.markSold
) {
  const response = await request(id, payload);
  if (!response.success || !response.data?.opportunity)
    throw new Error(
      response.message || 'The deal could not be marked as sold.'
    );
  return {
    ...response.data,
    message: response.message || 'Deal marked as sold.',
  };
}
