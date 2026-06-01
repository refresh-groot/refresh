import React, { useRef, useState, useEffect } from 'react';
import './Community.css';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronDown, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import api from '../../api/axios';
import { SERVER_URL } from '../../app/constants';

const Community = () => {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentSort, setCurrentSort] = useState('최신순');
  const dropdownRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 초기값을 빈 배열로 설정하여 length 에러 방지
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const Navigate = useNavigate();
  
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const sortMap = { '최신순': 'new', '댓글순': 'chat', '좋아요순': 'likes' };
         console.log('📌 currentSort:', currentSort);           // 추가
    console.log('📌 sortMap 변환값:', sortMap[currentSort]); // 추가
        const res = await api.get('/api/community', {
          params: {
            category: activeCategory === '전체' ? undefined : activeCategory,
            sort: sortMap[currentSort],
            search: searchTerm || undefined,
            page: currentPage
          }
        });
        
        // 데이터 구조 안전하게 받기
        if (res.data && res.data.posts) {
          console.log('📌 서버에서 받은 전체 게시글:', res.data.posts);
          setPosts(res.data.posts);
          setTotalPages(res.data.totalPages || 1);
        } else {
          // 페이지네이션 적용 전 데이터 구조(배열)일 경우 대응
          setPosts(Array.isArray(res.data) ? res.data : []);
          setTotalPages(1);
        }
      } catch (e) {
        console.error('게시글 목록 불러오기 실패:', e);
        setPosts([]); // 에러 시 빈 배열로 초기화
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchPosts, 300);
    return () => clearTimeout(timer);
  }, [activeCategory, currentSort, searchTerm, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchTerm, currentSort]);

  const Categories = [{name: '전체'}, {name: '질문'}, {name: '정보공유'}, {name: '자랑'}, {name: '고민'}];
  const sortOptions = [{ label: '최신순', value: 'new' }, { label: '좋아요순', value: 'likes' }, { label: '댓글순', value: 'chat' }];

  const formatRelativeDate = (dateString) => {
    console.log('날짜값:', dateString);
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000); // 초 단위

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}주 전`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}개월 전`;
  return `${Math.floor(diff / 31536000)}년 전`;
};
  return (
    <div className="community-page">
      <div className="community-inner">
        <aside className='community-sidebar'>
          <div className="sidebar-title">카테고리</div>
          {Categories.map((cat) => (
            <div
              key={cat.name}
              className={`sidebar-item ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.name)}>
              {cat.name}
            </div>
          ))}
          <button className='sidebar-write-btn' onClick={() => Navigate('/community/write')}>글쓰기</button>
        </aside>
        <main className='community-main'>
          <div className="community-main-container">
            <div className="search-box">
              <input type="text" placeholder='검색어를 입력하세요' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
              <FaSearch className='search-icon'/>
            </div>
            <div className="dropdown" ref={dropdownRef}>
              <div className="dropdown-selected" onClick={() => setIsSortOpen(!isSortOpen)}>
                {currentSort}
                <FaChevronDown className={`arrow-icon ${isSortOpen ? 'open' : ''}`} />
              </div>
              {isSortOpen && (
                <ul className='dropdown-list'>
                  {sortOptions.map((option) => (
                    <li
                      key={option.value}
                      onClick={() => {setCurrentSort(option.label); setIsSortOpen(false);}}
                      className={currentSort === option.label ? 'selected' : ''}>
                      {option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="post-list">
            {loading && <div className="loading">불러오는 중...</div>}
            
            {/* posts가 undefined일 경우를 대비해 옵셔널 체이닝 사용 */}
            {!loading && posts?.length === 0 && <div className="no-posts">게시글이 없습니다.</div>}
            
            {!loading && posts?.map((post) => (
              <div key={post.id} className="post-card" onClick={() => Navigate(`/community/${post.id}`)}>
                <div className="post-card-content-wrapper">
                  <div className="post-text-area">
                    <div className="post-top">
                      <span className={`post-badge badge-${post.category}`}>{post.category}</span>
                      <span className="post-title">{post.title}</span>
                    </div>
                    <div className="post-preview">{post.preview}</div>
                  </div>
                  {post.image && (
                    <div className="post-list-image-v2">
                      <img src={`${SERVER_URL}${post.image}`} alt="post" />
                    </div>
                  )}
                </div>
                <div className="post-bottom">
                  <span>{post.author}</span>
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                  <span>{formatRelativeDate(post.date || post.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="page-btn"
              >
                <FaChevronLeft />
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="page-btn"
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Community;