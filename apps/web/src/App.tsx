import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AcolhidosListPage } from './pages/acolhidos/AcolhidosListPage'
import { AcolhidoFormPage } from './pages/acolhidos/AcolhidoFormPage'
import { AcolhidoDetailPage } from './pages/acolhidos/AcolhidoDetailPage'
import { AssistPage } from './pages/triagens/AssistPage'
import { AuditPage } from './pages/triagens/AuditPage'
import { AtividadesPage } from './pages/atividades/AtividadesPage'
import { PresencaPage } from './pages/atividades/PresencaPage'
import { FinanceiroPage } from './pages/financeiro/FinanceiroPage'
import { ConfiguracoesPage } from './pages/configuracoes/ConfiguracoesPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="acolhidos" element={
              <ProtectedRoute modulo="acolhidos"><AcolhidosListPage /></ProtectedRoute>
            } />
            <Route path="acolhidos/novo" element={
              <ProtectedRoute modulo="acolhidos"><AcolhidoFormPage /></ProtectedRoute>
            } />
            <Route path="acolhidos/:id" element={
              <ProtectedRoute modulo="acolhidos"><AcolhidoDetailPage /></ProtectedRoute>
            } />
            <Route path="acolhidos/:id/editar" element={
              <ProtectedRoute modulo="acolhidos"><AcolhidoFormPage /></ProtectedRoute>
            } />
            <Route path="acolhidos/:id/triagem/assist" element={
              <ProtectedRoute modulo="acolhidos"><AssistPage /></ProtectedRoute>
            } />
            <Route path="acolhidos/:id/triagem/audit" element={
              <ProtectedRoute modulo="acolhidos"><AuditPage /></ProtectedRoute>
            } />
            <Route path="atividades" element={
              <ProtectedRoute modulo="atividades"><AtividadesPage /></ProtectedRoute>
            } />
            <Route path="atividades/:id/presenca" element={
              <ProtectedRoute modulo="atividades"><PresencaPage /></ProtectedRoute>
            } />
            <Route path="financeiro" element={
              <ProtectedRoute modulo="financeiro"><FinanceiroPage /></ProtectedRoute>
            } />
            <Route path="configuracoes" element={
              <ProtectedRoute modulo="configuracoes"><ConfiguracoesPage /></ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
