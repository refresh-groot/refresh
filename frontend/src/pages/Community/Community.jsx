import React, { useRef, useState, useEffect} from 'react';
import './Community.css';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronDown } from "react-icons/fa";
import api from '../../api/axios';
import { SERVER_URL } from '../../app/constants';

const Community = () => {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentSort, setCurrentSort] = useState('최신순');
  const dropdownRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const Navigate = useNavigate();
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const sortMap = { '최신순': 'new', '관련도순': 'type', '좋아요순': 'likes' };
        const res = await api.get('/api/community', {
          params: {
            category: activeCategory === '전체' ? undefined : activeCategory,
            sort: sortMap[currentSort],
            search: searchTerm || undefined,
          }
        });
        setPosts(res.data);
      } catch (e) {
        console.error('게시글 목록 불러오기 실패:', e);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchPosts, 300);
    return () => clearTimeout(timer);
  }, [activeCategory, currentSort, searchTerm]);

  const Categories = [
    {name: '전체'},
    {name: '질문'},
    {name: '정보공유'},
    {name: '자랑'},
    {name: '고민'},
  ];

  const sortOptions = [
    { label: '최신순', value: 'new' },
    { label: '관련도순', value: 'type' },
    { label: '좋아요순', value: 'good' }
  ];

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
                      onClick={() => {
                        setCurrentSort(option.label);
                        setIsSortOpen(false);
                      }}
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
            {!loading && posts.length === 0 && (
              <div className="no-posts">게시글이 없습니다.</div>
            )}
            {!loading && posts.map((post) => (
              <div key={post.id} className="post-card" onClick={() => Navigate(`/community/${post.id}`)}>
                <div className="post-top">
                  <span className={`post-badge badge-${post.category}`}>{post.category}</span>
                  <span className="post-title">{post.title}</span>
                </div>
                {post.image && (
                  <div className="post-list-image">
                    <img src={`${SERVER_URL}${post.image}`} alt="post" />
                  </div>
                )}
                <div className="post-preview">{post.preview}</div>
                <div className="post-bottom">
                  <span>{post.author}</span>
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                  <span>{post.date}</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Community;