import React from 'react';

interface EditControlsProps {
  onCrop: () => void;
  onDelete: () => void;
  onExport: () => void;
  hasSelection: boolean;
  hasBeenEdited: boolean;
  isEditing: boolean;
}

const EditControls: React.FC<EditControlsProps> = ({ onCrop, onDelete, onExport, hasSelection, hasBeenEdited, isEditing }) => {
  return (
    <div className="card mt-3">
      <div className="card-body text-center">
        <h6 className="card-title">編集ツール</h6>
        <p className="card-text text-muted">
          上のタイムラインを操作して範囲を選択し、編集してください。
        </p>
        <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
            <button
              className="btn btn-primary"
              onClick={onCrop}
              disabled={!hasSelection}
            >
              ✂️ 切り出し
            </button>
            <button
              className="btn btn-danger"
              onClick={onDelete}
              disabled={!hasSelection}
            >
              🗑️ 削除
            </button>
        </div>
        
        {/* 区切り線 */}
        <hr className="my-3" />
        
        {/* エクスポートセクション */}
        <div className="text-center">
          <p className="text-muted small mb-2">
            {isEditing 
              ? '編集中はエクスポートできません' 
              : hasBeenEdited 
                ? '編集済みのデータをエクスポートできます' 
                : '編集後にエクスポートが可能になります'
            }
          </p>
          <button
            className={`btn btn-success ${(!hasBeenEdited || isEditing) ? 'opacity-50' : ''}`}
            onClick={onExport}
            disabled={!hasBeenEdited || isEditing}
          >
            📤 GPXファイルの書き出し（エクスポート）
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditControls;
