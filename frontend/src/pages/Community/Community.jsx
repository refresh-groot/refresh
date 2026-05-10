import React, { useRef, useState, useEffect} from 'react'
import './Community.css';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronDown } from "react-icons/fa";


const Community = () => {

  const [activeCategory, setActiveCategory] = useState('전체');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentSort, setCurrentSort] = useState('최신순');
  const dropdownRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  const Categories = [
    {name: '전체'},
    {name: '질문'},
    {name: '정보공유'},
    {name: '자랑'},
    {name: '고민'},
  ]

  const sortOptions = [
    { label: '최신순', value: 'new' },
    { label: '관련도순', value: 'type' },
    { label: '좋아요순', value: 'good' }
  ];
  
  const posts = [
  {
    id: 1,
    category: '질문',
    title: '몬스테라 잎이 자꾸 노래지는데 왜 그럴까요?',
    preview: '토양 수분은 40% 유지 중인데 계속 노래져서요. 빛이 문제일까요?',
    author: 'admin',
    likes: 24,
    comments: 8,
    date: '5분 전',
    image: null,
  },
  {
    id: 2,
    category: '정보공유',
    title: '토양 수분 센서 캘리브레이션 방법 공유합니다',
    preview: '직접 건조 상태와 포화 상태를 측정해서 기준값으로 쓰면 정확도가 훨씬 올라가요.',
    author: 'new',
    likes: 12,
    comments: 3,
    date: '1시간 전',
    image: null,
  },
  {
    id: 3,
    category: '자랑',
    title: '드디어 장미 꽃 피었어요!',
    preview: 'Refresh 앱으로 관리한 지 한 달 만에 꽃이 폈습니다 너무 기뻐요!',
    author: 'admin',
    likes: 47,
    comments: 15,
    date: '3시간 전',
    image: null,
  },
];

  const filteredPosts = posts.filter((post) => {
    const matchedCategory = activeCategory === '전체' || post.category === activeCategory;
    const matchedSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.preview.toLowerCase().includes(searchTerm.toLowerCase());
                        return matchedCategory && matchedSearch;
  });

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
                  onClick={() => {setCurrentSort(option.label);
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
  {filteredPosts.map((post) => (
    <div key={post.id} className="post-card" onClick={() => Navigate(`/community/${post.id}`)}>
      <div className="post-top">
        <span className={`post-badge badge-${post.category}`}>{post.category}</span>
        <span className="post-title">{post.title}</span>
    </div>
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
  )
}

export default Community