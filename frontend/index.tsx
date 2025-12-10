import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Define Props and State interfaces for strict typing
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    // Check if it's the specific SecurityError to avoid logging noise
    const isSecurityError = error?.name === 'SecurityError' || 
                           (typeof error?.message === 'string' && error.message.includes('insecure'));
    
    if (!isSecurityError) {
      console.error("Uncaught error:", error);
    }
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const isSecurityError = error?.name === 'SecurityError' || 
                             (typeof error?.message === 'string' && error.message.includes('insecure'));
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : JSON.stringify(error, null, 2);

      return (
        <div className="p-8 font-sans max-w-2xl mx-auto mt-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {isSecurityError ? 'Acesso ao Armazenamento Bloqueado' : 'Ops! Algo deu errado'}
          </h1>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 text-sm mb-6 shadow-sm">
            {isSecurityError ? (
              <div className="space-y-3">
                <p className="font-semibold">
                  O seu navegador bloqueou o acesso ao LocalStorage/Cookies.
                </p>
                <p>
                  Isso geralmente acontece quando:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O site está rodando em uma janela anônima rigorosa.</li>
                  <li>Cookies de terceiros estão bloqueados nas configurações.</li>
                  <li>O site está sendo exibido dentro de uma visualização incorporada (iframe) segura.</li>
                </ul>
                <p className="mt-2">
                  O aplicativo tentou usar um modo de compatibilidade, mas o bloqueio persistiu. 
                  Tente abrir em uma nova aba normal.
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-60">
                <p className="font-bold mb-2">Detalhes do erro:</p>
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {errorMessage}
                </pre>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap font-mono text-xs mt-4 text-gray-600">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-md font-medium"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);