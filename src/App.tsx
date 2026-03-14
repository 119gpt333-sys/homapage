import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { PostDetailPage } from './pages/PostDetailPage'
import { WritePage } from './pages/WritePage'
import { EditPage } from './pages/EditPage'
import { PageShell } from './components/layout/PageShell'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function RedirectUuidToPost() {
  const { id } = useParams<{ id: string }>()
  if (id && UUID_REGEX.test(id)) {
    return <Navigate to={`/post/${id}`} replace />
  }
  return <Navigate to="/" replace />
}

function App() {
  return (
    <BrowserRouter>
      <PageShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/post/:id/edit" element={<EditPage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/write" element={<WritePage />} />
          <Route path="/:id" element={<RedirectUuidToPost />} />
        </Routes>
      </PageShell>
    </BrowserRouter>
  )
}

export default App
