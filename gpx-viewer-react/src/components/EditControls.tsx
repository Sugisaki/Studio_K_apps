import React from 'react';

interface EditControlsProps {
  onCrop: () => void;
  onDelete: () => void;
  hasSelection: boolean;
}

const EditControls: React.FC<EditControlsProps> = ({ onCrop, onDelete, hasSelection }) => {
  return (
    <div className="card mt-3">
      <div className="card-body text-center">
        <h6 className="card-title">編集ツール</h6>
        <p className="card-text text-muted">
          下のタイムラインを操作して範囲を選択し、編集してください。
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
      </div>
    </div>
  );
};

export default EditControls;