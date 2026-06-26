document.addEventListener('DOMContentLoaded', function () {

    // =================================================================================
    // === 1. КРИТИЧЕСКИ ВАЖНЫЙ КОД (Выполняется сразу) =================================
    // =================================================================================

    function initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        if (!mobileMenuBtn || !navLinks) return;

        const menuIcon = mobileMenuBtn.querySelector('i');
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            navLinks.classList.toggle('active');
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            menuIcon.classList.toggle('fa-bars', isExpanded);
            menuIcon.classList.toggle('fa-times', !isExpanded);
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                    menuIcon.classList.remove('fa-times');
                    menuIcon.classList.add('fa-bars');
                }
            });
        });
    }

    function initProgressiveImage() {
        const heroImage = document.querySelector('.progressive-image');
        if (!heroImage) return;

        const highResImage = new Image();
        highResImage.onload = () => {
            heroImage.src = heroImage.dataset.src;
            if (heroImage.dataset.srcset) {
                heroImage.srcset = heroImage.dataset.srcset;
            }
            heroImage.classList.add('loaded');
        };
        highResImage.src = heroImage.dataset.src;
        if (heroImage.dataset.srcset) {
            highResImage.srcset = heroImage.dataset.srcset;
        }
    }

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]:not([href="#"]):not(.js-start-test-btn)').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
                }
            });
        });
    }

    function initConversionTracking() {
        document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
            link.addEventListener('click', () => {
                if (typeof safeGtag !== 'function') return;
                const url = link.getAttribute('href');
                let eventLabel = 'whatsapp_click';
                if (url.includes('Парную')) eventLabel = 'whatsapp_couple';
                else if (url.includes('Индивидуальную')) eventLabel = 'whatsapp_individual';
                else if (url.includes('contact')) eventLabel = 'whatsapp_contact_form';
                safeGtag('event', 'conversion', {'send_to': 'AW-17591249605/FZ8cCNi8358bEMXVlMRB','event_category': 'Конверсия','event_label': eventLabel});
            });
        });

        document.querySelectorAll('.js-start-test-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof safeGtag !== 'function') return;
                safeGtag('event', 'conversion', {'send_to': 'AW-17591249605/FZ8cCNi8358bEMXVlMRB','event_category': 'Конверсия','event_label': 'Нажатие_Теста'});
            });
        });
    }

    // Присваиваем ID слайдам СРАЗУ для доступности
    function assignCarouselSlideIds() {
        const slides = document.querySelectorAll('.diploma-card');
        slides.forEach((slide, index) => {
            slide.id = `slide${index + 1}`;
        });
    }

    // --- ЗАПУСКАЕМ ТОЛЬКО САМОЕ ВАЖНОЕ ---
    initMobileMenu();
    initProgressiveImage();
    initSmoothScroll();
    initConversionTracking();
    assignCarouselSlideIds();


    // =================================================================================
    // === 2. ЛЕНИВАЯ ИНИЦИАЛИЗАЦИЯ КОМПОНЕНТОВ (По мере прокрутки) ======================
    // =================================================================================

    const lazySections =[
        { id: 'diploma-carousel', init: initCarousel },
        { id: 'testModal', init: initTestModal },
        { id: 'faq', init: initFaqAccordion },
        { id: 'articles', init: initArticleLoader }
    ];

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = lazySections.find(s => s.id === entry.target.id);
                if (section && !section.initialized) {
                    section.init();
                    section.initialized = true;
                    observer.unobserve(entry.target);
                }
            }
        });
    }, { rootMargin: '200px' });

    lazySections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
            observer.observe(element);
        }
    });

    // =================================================================================
    // === 3. ОПРЕДЕЛЕНИЕ ФУНКЦИЙ ДЛЯ ЛЕНИВОЙ ЗАГРУЗКИ =================================
    // =================================================================================

    // --- НОВАЯ СОВРЕМЕННАЯ КАРУСЕЛЬ ДИПЛОМОВ ---
    function initCarousel() {
        const carousel = document.querySelector('.diploma-carousel');
        const slides = document.querySelectorAll('.diploma-card');
        const prevBtn = document.querySelector('.diploma-scroll-prev');
        const nextBtn = document.querySelector('.diploma-scroll-next');
        const navContainer = document.querySelector('.diplomas-navigation');
        
        // Переменные для Lightbox (увеличенного просмотра)
        const lightbox = document.getElementById('diplomaLightbox');
        const lightboxImg = document.getElementById('lightboxImage');
        const lightboxClose = document.querySelector('.lightbox-close');
        
        if (!carousel || !slides.length) return;

        // 1. Динамическое создание точек навигации
        if (navContainer) {
            navContainer.innerHTML = '';
            slides.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = 'diploma-indicator' + (index === 0 ? ' active' : '');
                dot.setAttribute('aria-label', `Перейти к слайду ${index + 1}`);
                dot.addEventListener('click', () => scrollToSlide(index));
                navContainer.appendChild(dot);
            });
        }
        const indicators = document.querySelectorAll('.diploma-indicator');

        // 2. Логика выделения карточки по центру (Эффект фокуса Apple/AppStore)
        const observerOptions = {
            root: carousel,
            rootMargin: '0px',
            threshold: 0.6 // Срабатывает, когда карточка на 60% в зоне видимости
        };

        let currentIndex = 0;

        const carouselObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Убираем активный класс у всех
                    slides.forEach(s => s.classList.remove('is-active'));
                    indicators.forEach(i => i.classList.remove('active'));
                    
                    // Добавляем текущему
                    entry.target.classList.add('is-active');
                    
                    // Обновляем точку
                    const index = Array.from(slides).indexOf(entry.target);
                    currentIndex = index;
                    if(indicators[index]) indicators[index].classList.add('active');
                }
            });
        }, observerOptions);

        slides.forEach(slide => carouselObserver.observe(slide));

        // 3. Плавная прокрутка
        function scrollToSlide(index) {
            if (index < 0 || index >= slides.length) return;
            const slide = slides[index];
            const scrollLeft = slide.offsetLeft - (carousel.offsetWidth / 2) + (slide.offsetWidth / 2);
            carousel.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }

        if (prevBtn) prevBtn.addEventListener('click', () => scrollToSlide(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => scrollToSlide(currentIndex + 1));

        // 4. Логика Lightbox (Увеличение по клику)
        slides.forEach(slide => {
            slide.addEventListener('click', function() {
                // Если кликнули на неактивный (боковой) слайд - плавно прокручиваем его в центр
                if (!this.classList.contains('is-active')) {
                    const index = Array.from(slides).indexOf(this);
                    scrollToSlide(index);
                    return;
                }
                
                // Если кликнули на активный центральный - открываем Lightbox
                if (lightbox && lightboxImg) {
                    const imgSrc = this.querySelector('img').src;
                    lightboxImg.src = imgSrc;
                    lightbox.classList.add('active');
                    document.body.classList.add('body-modal-open'); // Используем сущ. класс для блокировки скролла тела
                }
            });
        });

        // Функция закрытия Lightbox
        const closeLightbox = () => {
            if (lightbox) {
                lightbox.classList.remove('active');
                document.body.classList.remove('body-modal-open');
                setTimeout(() => { if (lightboxImg) lightboxImg.src = ''; }, 300); // Очищаем после окончания анимации
            }
        };

        if(lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        
        if(lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox || e.target.classList.contains('lightbox-backdrop')) {
                    closeLightbox();
                }
            });
        }

        // Закрытие Lightbox по клавише Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });

        // Инициализация (центрируем первую карточку)
        setTimeout(() => scrollToSlide(0), 100);
    }

    // --- ТЕСТ ОТНОШЕНИЙ ---
    function initTestModal() {
        const allTestButtons = document.querySelectorAll('.js-start-test-btn');
        const testModal = document.getElementById('testModal');
        const closeTestBtn = document.getElementById('closeTestBtn');
        const testContent = document.getElementById('testContent');
        if (!testModal || !closeTestBtn || !testContent || !allTestButtons.length) return;

        const questions =[
            { q: "Как часто вы чувствуете себя понятым(ой) партнером?", opts:["Почти всегда", "Иногда", "Редко", "Никогда"] },
            { q: "Как часто вы ссоритесь?", opts:["Очень редко", "Иногда, но быстро миримся", "Довольно часто", "Постоянно"] },
            { q: "Насколько вы доверяете партнеру?", opts:["Полностью", "В основном", "С оговорками", "Почти не доверяю"] },
            { q: "Как часто вы проводите время вместе с удовольствием?", opts:["Регулярно", "Иногда", "Редко", "Почти никогда"] },
            { q: "Как вы оцениваете открытость в общении с партнером?", opts:["Очень открыто", "Скорее открыто", "Скорее закрыто", "Совсем закрыто"] },
            { q: "Насколько вы довольны распределением обязанностей в паре?", opts:["Полностью доволен", "В целом доволен", "Есть претензии", "Недоволен"] }
        ];

        function startRelationshipTest() {
            let currentQuestion = 0;
            let score = 0;

            function showQuestion() {
                if (currentQuestion >= questions.length) {
                    showResults();
                    return;
                }
                const question = questions[currentQuestion];
                let html = `<div class="test-question"><h3>${question.q}</h3><div class="test-options">`;
                question.opts.forEach((opt, index) => {
                    html += `<button class="test-option" data-score="${3 - index}">${opt}</button>`;
                });
                html += `</div></div>`;
                testContent.innerHTML = html;

                testContent.querySelectorAll('.test-option').forEach(btn => {
                    btn.addEventListener('click', () => {
                        score += parseInt(btn.dataset.score);
                        currentQuestion++;
                        showQuestion();
                    });
                });
            }

            function showResults() {
                let resultText = '', recommendation = '';
                if (score >= 18) { resultText = 'Отличные отношения!'; recommendation = 'Ваши отношения выглядят крепкими и здоровыми. Продолжайте работать над ними и наслаждаться друг другом!'; }
                else if (score >= 12) { resultText = 'Хорошие отношения'; recommendation = 'У вас хорошие отношения, но есть области для улучшения. Парная терапия может помочь укрепить вашу связь.'; }
                else if (score >= 6) { resultText = 'Есть проблемы'; recommendation = 'Ваших отношениях есть значительные трудности. Парная терапия может помочь вам лучше понять друг друга и улучшить общение.'; }
                else { resultText = 'Серьёзные проблемы'; recommendation = 'Ваши отношения находятся в кризисе. Рекомендуется срочно обратиться к парному психологу для профессиональной помощи.'; }

                testContent.innerHTML = `<div class="test-results"><h3>Результаты теста</h3><p>Ваш результат: <strong>${resultText}</strong></p><p>${recommendation}</p><div class="test-actions"><a href="https://wa.me/37126037277?text=Здравствуйте!%20Я%20прошел(а)%20тест%20отношений%20и%20хочу%20записаться%20на%20консультацию" class="btn btn-primary" target="_blank">Записаться на консультацию</a><button class="btn btn-outline" id="restartTest">Пройти тест снова</button></div></div>`;
                document.getElementById('restartTest').addEventListener('click', startRelationshipTest);
            }
            showQuestion();
        }

        allTestButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                testModal.classList.add('active');
                document.body.classList.add('body-modal-open');
                startRelationshipTest();
            });
        });

        const closeModal = () => {
            testModal.classList.remove('active');
            document.body.classList.remove('body-modal-open');
        };

        closeTestBtn.addEventListener('click', closeModal);
        testModal.addEventListener('click', (e) => {
            if (e.target === testModal || e.target.classList.contains('modal-backdrop')) {
                closeModal();
            }
        });
    }

    // --- FAQ АККОРДЕОН ---
    function initFaqAccordion() {
        const faqButtons = document.querySelectorAll('.faq-question');
        faqButtons.forEach(button => {
            button.addEventListener('click', () => {
                const isExpanded = button.getAttribute('aria-expanded') === 'true';
                const answer = button.nextElementSibling;
                const icon = button.querySelector('.faq-icon');

                faqButtons.forEach(btn => {
                    if (btn !== button) {
                        btn.setAttribute('aria-expanded', 'false');
                        btn.nextElementSibling.classList.remove('open');
                        btn.querySelector('.faq-icon').classList.remove('rotate');
                    }
                });
                
                if (!isExpanded) {
                    button.setAttribute('aria-expanded', 'true');
                    answer.classList.add('open');
                    icon.classList.add('rotate');
                } else {
                    button.setAttribute('aria-expanded', 'false');
                    answer.classList.remove('open');
                    icon.classList.remove('rotate');
                }
            });
        });
        
        const faqCards = document.querySelectorAll('.faq-card');
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = 1;
                    entry.target.style.transform = 'translateY(0)';
                    cardObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        faqCards.forEach(card => {
            card.style.opacity = 0;
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            cardObserver.observe(card);
        });
    }

    // --- ЗАГРУЗКА СТАТЕЙ ---
    function initArticleLoader() {
        function loadGottmanArticle(url, targetId) {
            const container = document.getElementById(targetId);
            if (!container) return;

            fetch(url)
                .then(response => { if (!response.ok) throw new Error(`Network response was not ok`); return response.text(); })
                .then(html => {
                    container.innerHTML = html;
                    const btn = container.querySelector('.read-more-btn');
                    const content = container.querySelector('.more-content');
                    if (btn && content) {
                        content.style.display = 'none';
                        btn.onclick = function () {
                            const isExpanded = content.style.display === 'block';
                            content.style.display = isExpanded ? 'none' : 'block';
                            btn.textContent = isExpanded ? 'Читать далее' : 'Свернуть';
                        };
                    }
                })
                .catch(error => {
                    console.error('Ошибка загрузки статьи:', error);
                    container.innerHTML = `<div style="text-align: center; padding: 20px; color: #e11d48;">Не удалось загрузить статью.</div>`;
                });
        }
        loadGottmanArticle('articles/den-surka.html', 'gottman-article1');
        loadGottmanArticle('articles/on-ne-slyshit.html', 'gottman-article2');
        loadGottmanArticle('articles/metod_gotmana.html', 'gottman-article3');
    }

    // =================================================================================
    // === 4. ДИНАМИЧЕСКАЯ ССЫЛКА WHATSAPP (Форма контактов) ===========================
    // =================================================================================
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const serviceSelect = document.getElementById('service');
    const messageTextarea = document.getElementById('message');
    const whatsappBtn = document.getElementById('whatsapp-form-btn');

    if (nameInput && phoneInput && serviceSelect && messageTextarea && whatsappBtn) {
        
        const updateWhatsAppLink = () => {
            const baseWhatsAppUrl = 'https://wa.me/37126037277';
            
            // Собираем данные из формы
            const name = nameInput.value;
            const phone = phoneInput.value;
            const service = serviceSelect.options[serviceSelect.selectedIndex].text;
            const message = messageTextarea.value;

            // Формируем текст сообщения
            let text = `Здравствуйте! Я хочу записаться на консультацию.\n\n`;
            if (name) text += `Имя: ${name}\n`;
            if (phone) text += `Телефон: ${phone}\n`;
            if (serviceSelect.value) text += `Услуга: ${service}\n`;
            if (message) text += `Сообщение: ${message}\n`;

            // Кодируем текст для URL и обновляем ссылку на кнопке
            whatsappBtn.href = `${baseWhatsAppUrl}?text=${encodeURIComponent(text)}`;
        };

        // Добавляем обработчики событий, которые будут обновлять ссылку при любом вводе
        nameInput.addEventListener('input', updateWhatsAppLink);
        phoneInput.addEventListener('input', updateWhatsAppLink);
        serviceSelect.addEventListener('input', updateWhatsAppLink);
        messageTextarea.addEventListener('input', updateWhatsAppLink);

        // Вызываем функцию один раз при загрузке на случай, если браузер сохранил значения
        updateWhatsAppLink();
    }

});

// =================================================================================
// === 5. ГЛОБАЛЬНАЯ ПРОГРЕССИВНАЯ ЗАГРУЗКА ИЗОБРАЖЕНИЯ (Fallback) =================
// =================================================================================
const topHeroImage = document.querySelector('.progressive-image');

if (topHeroImage) {
  // Создаем в памяти новое изображение, чтобы загрузить его в фоне
  const highResImage = new Image();
  const highResSrc = topHeroImage.dataset.src;
  const highResSrcset = topHeroImage.dataset.srcset;

  // Как только качественное изображение загрузится в памяти...
  highResImage.onload = function() {
    // ...подменяем атрибуты у видимого изображения
    topHeroImage.src = highResSrc;
    if (highResSrcset) topHeroImage.srcset = highResSrcset;
    // И добавляем класс для удаления размытия
    topHeroImage.classList.add('loaded');
  };

  // Запускаем загрузку качественного изображения в памяти
  highResImage.src = highResSrc;
  if (highResSrcset) highResImage.srcset = highResSrcset;
}