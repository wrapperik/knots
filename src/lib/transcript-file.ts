import { ErrorCode, type FileRejection } from 'react-dropzone'

export const MAX_TRANSCRIPT_BYTES = 1_000_000

// Operating systems report MIME types for .md and .vtt inconsistently,
// so the extensions are listed too. react-dropzone accepts a match on either.
export const ACCEPTED_EXTENSIONS = ['.txt', '.vtt', '.md' ]

export const ACCEPTED_TRANSCRIPT_TYPES = {
    'text/plain' : ['.txt'],
    'text/vtt': ['.vtt'],
    'text/markdown': ['.md'],
}

// A .log or .csv file can also report as text/plain, so the name is checked too.
export function hasAcceptedExtension(fileName: string): boolean {
const name = fileName.toLowerCase()
return ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension))
}

// Maps react-dropzone's error codes to readable messages.
export function describeRejection(rejection: FileRejection): string {
switch (rejection.errors[0]?.code) {
case ErrorCode.FileInvalidType:
return 'That file type is not supported :( Upload a .txt, .vtt or .md transcript.'
case ErrorCode.FileTooLarge:
return 'That file is over 1 MB. Try a shorter transcript, or paste the text instead.'
case ErrorCode.TooManyFiles:
return 'Upload one transcript at a time.'
default:
return 'We could not use that file. Please try another one.'

}
}