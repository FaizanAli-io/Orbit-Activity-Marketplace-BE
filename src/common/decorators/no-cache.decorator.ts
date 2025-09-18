import { SetMetadata } from '@nestjs/common';

export const NO_CACHE_KEY = 'cache:skip';
export const NoCache = () => SetMetadata(NO_CACHE_KEY, true);
