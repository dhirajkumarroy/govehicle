import { z } from 'zod';
import { updateProfileSchema } from './user.validation';

export type UpdateProfileRequestDto = z.infer<typeof updateProfileSchema>;
