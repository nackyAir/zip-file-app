"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as zip from "@zip.js/zip.js";
import { saveAs } from "file-saver";

export default function ZipGenerator() {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const getPasswordStrength = (pwd: string): { level: string; color: string } => {
    if (!pwd) return { level: "", color: "" };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;

    if (strength <= 1) return { level: "弱い", color: "text-red-500" };
    if (strength <= 3) return { level: "普通", color: "text-yellow-500" };
    return { level: "強い", color: "text-green-500" };
  };

  const generateZip = async () => {
    if (files.length === 0) {
      alert("ファイルを選択してください");
      return;
    }

    if (password && password !== confirmPassword) {
      alert("パスワードが一致しません");
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const blobWriter = new zip.BlobWriter("application/zip");
      const zipWriter = new zip.ZipWriter(blobWriter, {
        password: password || undefined,
        encryptionStrength: 3, // AES-256
      });

      const totalFiles = files.length;
      let processedFiles = 0;

      for (const file of files) {
        const reader = new zip.BlobReader(file);
        await zipWriter.add(file.name, reader, {
          onprogress: (current, total) => {
            const fileProgress = (current / total) * 100;
            const overallProgress = ((processedFiles + fileProgress / 100) / totalFiles) * 100;
            setProgress(Math.round(overallProgress));
          },
        });
        processedFiles++;
      }

      const blob = await zipWriter.close();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = password 
        ? `encrypted_archive_${timestamp}.zip`
        : `archive_${timestamp}.zip`;
      
      saveAs(blob, fileName);

      // Reset form
      setFiles([]);
      setPassword("");
      setConfirmPassword("");
      setShowConfirmPassword(false);
      setProgress(0);

      if (password) {
        alert("パスワード付きZIPファイルが正常に生成されました！");
      }
    } catch (error) {
      console.error("ZIP生成エラー:", error);
      alert("ZIPファイルの生成に失敗しました");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">ZIP ファイル生成ツール</h1>
        <p className="text-gray-600 dark:text-gray-400">
          ファイルをドラッグ＆ドロップまたは選択してZIPファイルを作成
        </p>
        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
          ✓ パスワード保護対応（AES-256暗号化）
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
      >
        <input {...getInputProps()} />
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isDragActive ? (
          <p className="text-lg">ドロップしてファイルを追加</p>
        ) : (
          <div>
            <p className="text-lg mb-2">ファイルをドラッグ＆ドロップ</p>
            <p className="text-sm text-gray-500">
              または クリックしてファイルを選択
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">
            選択されたファイル ({files.length})
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                  aria-label={`${file.name}を削除`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            パスワード (オプション)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setShowConfirmPassword(e.target.value.length > 0);
            }}
            placeholder="ZIPファイルのパスワードを入力"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          />
          {password && (
            <p className={`text-xs mt-1 ${passwordStrength.color}`}>
              パスワード強度: {passwordStrength.level}
            </p>
          )}
        </div>

        {showConfirmPassword && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-2"
            >
              パスワード確認
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="パスワードを再入力"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                パスワードが一致しません
              </p>
            )}
          </div>
        )}

        {isGenerating && (
          <div className="w-full">
            <div className="flex justify-between text-sm mb-1">
              <span>生成中...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={generateZip}
          disabled={files.length === 0 || isGenerating || (showConfirmPassword && password !== confirmPassword)}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isGenerating ? `生成中... (${progress}%)` : "ZIPファイルを生成"}
        </button>

        {password && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ パスワードは安全な場所に保管してください。忘れた場合、ファイルを復元できません。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}