import { SetMetadata } from '@nestjs/common';

export const VIEW_METADATA_KEY = 'requiredView';

export function RequireView(view: string) {
  return SetMetadata(VIEW_METADATA_KEY, view);
}
