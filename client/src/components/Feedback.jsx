import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function Feedback({ error, success }) {
  if (error) {
    return <div className="feedback error"><AlertCircle size={16} />{error}</div>
  }
  if (success) {
    return <div className="feedback success"><CheckCircle2 size={16} />{success}</div>
  }
  return null
}
