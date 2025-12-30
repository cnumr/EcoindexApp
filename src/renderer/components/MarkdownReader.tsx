import ReactMarkdown from 'react-markdown'

export const MarkdownReader = ({ file }: { file: string }) => {
    return <ReactMarkdown>{file}</ReactMarkdown>
}
