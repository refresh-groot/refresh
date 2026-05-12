import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CommunityDetail.css';
import api from '../../api/axios';
import { SERVER_URL } from '../../app/constants';
import { showToast } from '../../app/alert';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 모달 상태 관리
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/api/community/${id}`);
        setPost(res.data);
        setLikeCount(res.data.likes ?? res.data.like_count ?? 0);
        setIsLiked(res.data.isLiked);
      } catch (e) {
        console.error('게시글 불러오기 실패:', e);
      }
    };

    const fetchComments = async () => {
      try {
        const res = await api.get(`/api/community/${id}/comments`);
        setComments(res.data);
      } catch (e) {
        console.error('댓글 불러오기 실패:', e);
      }
    };

    fetchPost();
    fetchComments();
  }, [id]);

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/api/community/${id}`);
      showToast('success', '삭제 완료');
      navigate('/community');
    } catch (e) {
      console.error('삭제 실패:', e);
      showToast('error', '삭제 권한이 없거나 오류가 발생했습니다.');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleLike = async () => {
    try {
      const res = await api.post(`/api/community/${id}/like`);
      const { isLiked: newIsLiked } = res.data;
      setIsLiked(newIsLiked);
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    } catch (e) {
      console.error('좋아요 실패:', e);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/api/community/${id}/comments`, { content: newComment });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
      setPost(prev => prev ? { ...prev, comment_count: (prev.comment_count ?? 0) + 1 } : prev);
    } catch (e) {
      console.error('댓글 등록 실패:', e);
    }
  };

  if (!post) return <div className="detail-loading">불러오는 중...</div>;

  const myId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
  const postAuthorId = post?.user_id || post?.userId;
  const isAuthor = currentUser && post && (
    String(myId) === String(postAuthorId) ||
    currentUser.nickname === post.author
  );

  return (
    <div className='detail-page'>
      <div className="detail-inner">
        <div className="detail-main">
          <div className="detail-header-row">
            <div className="detail-back" onClick={() => navigate('/community')}>← 목록으로</div>
            {isAuthor && (
              <button className="post-delete-btn" onClick={() => setShowDeleteModal(true)}>삭제</button>
            )}
          </div>
          <div className={`detail-badge badge-${post.category}`}>{post.category}</div>
          <div className="detail-title">{post.title}</div>
          <div className="detail-author-row">
            <div className="detail-avatar">{post.author?.slice(0, 2)}</div>
            <div>
              <div className="detail-author-name">{post.author}</div>
              <div className="detail-author-date">{post.date}</div>
            </div>
          </div>
          {post.image && (
            <div className="detail-image-box">
              <img src={`${SERVER_URL}${post.image}`} alt="post" className="detail-main-img" />
            </div>
          )}
          <div className="detail-content">{post.content}</div>
          <div className="detail-action-row">
            <button className={`detail-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
              {isLiked ? '❤' : '🤍'} 좋아요 {likeCount}
            </button>
            <button className='detail-action-btn'>
              💬 댓글 {post.comment_count ?? 0}
            </button>
          </div>

          <div className="comment-section">
            <div className="comment-title">댓글 {comments.length}개</div>
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">{comment.author?.slice(0, 2)}</div>
                <div>
                  <div>
                    <span className="comment-author">{comment.author}</span>
                    <span className="comment-date">{comment.date}</span>
                  </div>
                  <div className="comment-text">{comment.content}</div>
                </div>
              </div>
            ))}
            <div className="comment-input-row">
              <input
                className="comment-input"
                type="text"
                placeholder="댓글을 입력하세요"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button className="comment-send-btn" onClick={handleCommentSubmit}>등록</button>
            </div>
          </div>
        </div>

        <div className="detail-panel">
          <div className="panel-title">작성자</div>
          <div className="panel-author-row">
            <div className="detail-avatar">{post.author?.slice(0, 2)}</div>
            <div>
              <div className="panel-author-name">{post.author}</div>
              <div className="panel-author-sub">게시글 작성자</div>
            </div>
          </div>
          {/* ... */}
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>✕</button>
            <h2>게시글 삭제</h2>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              정말로 이 게시글을 삭제하시겠습니까?<br/>
              삭제된 데이터는 복구할 수 없습니다.
            </p>
            <div className="modal-btns">
              <button className="modal-cancel-btn" onClick={() => setShowDeleteModal(false)}>취소</button>
              <button className="modal-confirm-btn red" onClick={handleConfirmDelete}>삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityDetail;