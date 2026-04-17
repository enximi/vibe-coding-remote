import { ScanIcon } from '../../../../ui/icons';
import type { ConnectionStatus } from '../../../runtime/model/useConnectionState';

interface ConnectionSettingsSectionProps {
  status: ConnectionStatus;
  endpointDraft: string;
  tokenDraft: string;
  onEndpointDraftChange: (value: string) => void;
  onTokenDraftChange: (value: string) => void;
  onApply: () => void;
  onOpenScanner: () => void;
}

export function ConnectionSettingsSection({
  status,
  endpointDraft,
  tokenDraft,
  onEndpointDraftChange,
  onTokenDraftChange,
  onApply,
  onOpenScanner,
}: ConnectionSettingsSectionProps) {
  return (
    <section className="settings-group connection-group">
      <div className="connection-header">
        <h3>Server 配置</h3>
        {status === 'checking' && <span className="status-badge checking">检查中...</span>}
        {status === 'workable' && <span className="status-badge ok">配置正常</span>}
        {status === 'unconfigured' && <span className="status-badge unconfigured">未配置完整</span>}
        {status === 'connection_error' && (
          <span className="status-badge disconnected-notice">连接失败</span>
        )}
        {status === 'auth_error' && (
          <span className="status-badge disconnected-notice">认证失败</span>
        )}
      </div>

      <div className="settings-card">
        <label className="settings-card-row">
          <span className="settings-card-label">地址</span>
          <input
            type="url"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="http://192.168.1.23:8765"
            value={endpointDraft}
            onChange={(event) => onEndpointDraftChange(event.target.value)}
            onBlur={onApply}
          />
        </label>
        <div className="settings-card-divider" />
        <label className="settings-card-row">
          <span className="settings-card-label">密钥</span>
          <input
            type="password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="必填的访问密钥"
            value={tokenDraft}
            onChange={(event) => onTokenDraftChange(event.target.value)}
            onBlur={onApply}
          />
        </label>
        <div className="settings-card-divider" />
        <button className="settings-card-btn" type="button" onClick={onApply}>
          测试并保存连接
        </button>
        <div className="settings-card-divider" />
        <button className="settings-card-btn" type="button" onClick={onOpenScanner}>
          <ScanIcon width={18} height={18} /> 扫码导入配置
        </button>
      </div>

      {status === 'connection_error' && (
        <p className="settings-error">连接失败，请检查地址或确保服务器已启动。</p>
      )}
      {status === 'unconfigured' && (
        <p className="settings-error">请同时填写 Server 地址和 Token，然后再重试连接。</p>
      )}
      {status === 'auth_error' && (
        <p className="settings-error">认证失败，请检查 Token 是否匹配。</p>
      )}

      <p className="settings-hint">
        填写电脑上 Vibe Coding Remote server 的地址和
        Token。留空时默认状态为“未配置”。修改后自动测试连接。
      </p>
    </section>
  );
}
