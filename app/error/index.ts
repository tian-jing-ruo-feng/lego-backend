import { h5PageErrorMessages } from './page';
import { uploadErrorMessage } from './upload';
import { userErrorMessages } from './user';
import { workErrorMessages } from './work';

export type GlobalErrorType = keyof (typeof userErrorMessages & typeof workErrorMessages & typeof uploadErrorMessage & typeof h5PageErrorMessages)
export const globalErrorMessage = {
  ...userErrorMessages,
  ...workErrorMessages,
  ...uploadErrorMessage,
  ...h5PageErrorMessages
}
