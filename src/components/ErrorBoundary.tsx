import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Erro de Banco de Dados: ${parsed.error}`;
            if (parsed.error.includes('permission-denied')) {
              errorMessage = 'Você não tem permissão para realizar esta operação ou acessar estes dados.';
            }
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4 font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-[var(--bg-card)] rounded-3xl shadow-2xl p-8 text-center border border-[var(--border-main)]"
          >
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2 tracking-tight">
              Ops! Algo deu errado
            </h1>
            
            <p className="text-[var(--text-muted)] mb-8 text-sm leading-relaxed">
              {errorMessage}
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 brand-gradient text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-accent/20"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 bg-[var(--bg-card)] text-[var(--text-main)] py-3 px-4 rounded-xl font-medium border border-[var(--border-main)] hover:bg-[var(--bg-active)] transition-colors"
              >
                <Home className="w-4 h-4" />
                Voltar ao Início
              </button>
            </div>

            {isFirestoreError && (
              <div className="mt-8 pt-6 border-t border-[var(--border-main)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">
                  Informações Técnicas
                </p>
                <div className="mt-2 p-3 bg-[var(--bg-input)] rounded-lg text-left overflow-auto max-h-32">
                  <pre className="text-[10px] text-[var(--text-muted)] font-mono whitespace-pre-wrap">
                    {this.state.error?.message}
                  </pre>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
