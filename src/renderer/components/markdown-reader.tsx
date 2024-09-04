import ReactMarkdown from 'react-markdown'
export const MarkdownReader = ({ file }: { file: any }) => {
    return <ReactMarkdown children={file} />
}
