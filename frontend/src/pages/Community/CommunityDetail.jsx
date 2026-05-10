import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import './CommunityDetail.css'
import api from '../../api/axios';

const CommunityDetail = () => {

  const {id} = useParams();
  const navigate = useNavigate();
  //const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const [post, setPost] = useState({
  id: 1,
  category: '질문',
  title: '몬스테라 잎이 자꾸 노래지는데 왜 그럴까요?',
  content: '토양 수분은 40% 유지 중인데 계속 노래져서요. 빛이 문제일까요?',
  author: 'admin',
  likes: 24,
  isLiked: false,
  comments: 8,
  date: '2026.04.28',
  image: null,
  });

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  useEffect(() => {
  const fetchPost = async () => {
    try {
      const res = await api.get(`/api/community/${id}`);
      setPost(res.data);
      setLikeCount(res.data.likes); 
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

  const handleCommentSubmit = async () => {
  if (!newComment.trim()) return;
  try {
    const res = await api.post(`/api/community/${id}/comments`, { content: newComment });
    setComments([...comments, res.data]); 
    setNewComment('');
  } catch (e) {
    console.error('댓글 등록 실패:', e);
  }
    };

  if (!post) return <div className="detail-loading">불러오는 중...</div>;

  return (
    <div className='detail-page'>
      <div className="detail-inner">
      <div className="detail-main">
        <div className="detail-back" onClick={() => navigate('/community')}>← 목록으로</div>
        <div className={`detail-badge badge-${post.category}`}>{post.category}</div>
        <div className="detail-title">{post.title}</div>
        <div className="detail-author-row">
        <div className="detail-avatar">{post.author.slice(0, 2)}</div>
      <div>
      <div className="detail-author-name">{post.author}</div>
      <div className="detail-author-date">{post.date}</div>
      </div>
    </div>
      <div className="detail-content">{post.content}</div>
      <div className="detail-action-row">
        <button className={`detail-action-btn ${isLiked ? 'liked' : ''}`}
        onClick={async () => {
        try {
        await api.post(`/api/community/${id}/like`);
        } catch (e) {
        console.error('좋아요 실패:', e);
        }
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
        }}>
        {isLiked ? '❤' : '🤍'} 좋아요 {likeCount}
        </button>
        <button className='detail-action-btn'>
        💬 댓글 {post.comments}
        </button>
      </div>
    <div className="comment-section">
      <div className="comment-title">댓글 {comments.length}개</div>
      {comments.map((comment) => (
      <div key={comment.id} className="comment-item">
      <div className="comment-avatar">{comment.author.slice(0, 2)}</div>
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
      <div className="detail-avatar">{post.author.slice(0, 2)}</div>
    <div>
      <div className="panel-author-name">{post.author}</div>
      <div className="panel-author-sub">게시글 12개</div>
    </div>
    </div>
      <div className="panel-title">통계</div>
      <div className="stat-grid">
      <div className="stat-card">
      <div className="stat-num">{likeCount}</div>
      <div className="stat-label">좋아요</div>
    </div>
    <div className="stat-card">
      <div className="stat-num">{post.comments}</div>
      <div className="stat-label">댓글</div>
    </div>
    </div>
      <div className="panel-title">관련 게시글</div>
    <div>
      <div className="related-item" onClick={() => navigate('/community/2')}>
      <div className="related-title">몬스테라 물 주기 팁 공유해요</div>
      <div className="related-meta">정보공유 · 좋아요 18</div>
    </div>
      <div className="related-item" onClick={() => navigate('/community/3')}>
      <div className="related-title">잎이 갈색으로 변할 때 대처법</div>
      <div className="related-meta">질문 · 좋아요 9</div>
    </div>
    </div>
    </div>
    </div>
    </div>
  )
}

export default CommunityDetail