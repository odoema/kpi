import React from 'react';
import autoBind from 'react-autobind';
import reactMixin from 'react-mixin';
import Reflux from 'reflux';
import bem from '../../bem';
import stores from '../../stores';
import {
  PAGE_SIZE,
  ORDER_OPTIONS,
  GROUPBY_OPTIONS,
  galleryActions,
  galleryStore
} from './galleryInterface';
import { dataInterface } from '../../dataInterface';
import FormGalleryGridItem from './formGalleryGridItem';
import {
  t,
  formatTimeDate
} from '../../utils';
import ReactPaginate from 'react-paginate';
import Select from 'react-select';

const OFFSET_OPTIONS = [
  {value: PAGE_SIZE * 2, label: '12'},
  {value: PAGE_SIZE * 4, label: '24'},
  {value: PAGE_SIZE * 8, label: '48'},
  {value: PAGE_SIZE * 16, label: '96'}
];
const SORT_OPTIONS = [
  ORDER_OPTIONS.asc,
  ORDER_OPTIONS.desc
];

export default class PaginatedGalleryModal extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      offset: OFFSET_OPTIONS[0],
      filterOrder: galleryStore.state.filterOrder,
      currentPage: 1,
      gallery: galleryStore.state.galleries[galleryStore.state.selectedGalleryIndex],
      filterGroupBy: galleryStore.state.filterGroupBy
    };
  }

  componentDidMount() {
    this.listenTo(galleryStore, (storeChanges) => {
      if (storeChanges.galleries) {
        this.setState({gallery: storeChanges.galleries[galleryStore.state.selectedGalleryIndex]});
      }
      if (storeChanges.filterGroupBy) {
        this.setState({filterGroupBy: storeChanges.filterGroupBy});
      }
      if (storeChanges.filterOrder) {
        this.setState({filterOrder: storeChanges.filterOrder});
        galleryActions.wipeLoadedGalleryData(galleryStore.state.selectedGalleryIndex);
        this.goToPage(1);
      }
    });
  }

  getTotalPages() {
    return Math.ceil(this.state.gallery.totalMediaCount / this.state.offset.value);
  }

  setCurrentPage(index) {
    this.setState({ currentPage: index });
  }

  changeOffset(offset) {
    this.setState({ offset: offset }, function() {
      this.goToPage(1);
    });
  }

  changeSort(sort) {
    galleryActions.setFilters({filterOrder: sort});
  }

  goToPage(newPage) {
    if (this.state.gallery.loadedMediaCount < (newPage + 1) * this.state.offset.value) {
      galleryActions.loadMoreGalleryMedias(
        this.state.gallery.galleryIndex,
        newPage,
        this.state.offset.value
      );
    }
    this.setCurrentPage(newPage);
  }

  getCurrentPageMedia() {
    const min = this.state.offset.value * (this.state.currentPage - 1);
    const max = this.state.offset.value * this.state.currentPage;
    return this.state.gallery.medias.filter((media) => {
      return (media.mediaIndex >= min && media.mediaIndex < max);
    });
  }

  getDisplayedMediaRange() {
    const currentPageMedia = this.getCurrentPageMedia();
    if (currentPageMedia.length === 0) {
      return '…';
    }
    const firstNumber = currentPageMedia[0].mediaIndex + 1;
    const lastNumber = currentPageMedia[currentPageMedia.length - 1].mediaIndex + 1;
    return `${firstNumber}-${lastNumber}`;
  }

  renderLoadingMessage() {
    return (
      <bem.Loading>
        <bem.Loading__inner>
          <i />
          {t('Loading…')}
        </bem.Loading__inner>
      </bem.Loading>
    );
  }

  renderGallery() {
    const currentPageMedia = this.getCurrentPageMedia();

    if (this.state.gallery.isLoading || currentPageMedia.length === 0) {
      return (
        <bem.PaginatedGalleryModal_galleryWrapper>
          {this.renderLoadingMessage()}
        </bem.PaginatedGalleryModal_galleryWrapper>
      );
    } else {
      return (
        <bem.PaginatedGalleryModal_galleryWrapper>
          <bem.AssetGalleryGrid m='6-per-row'>
            { currentPageMedia.map(
              (media, index) => {
                return (
                  <FormGalleryGridItem
                    key={index}
                    url={media.smallImage}
                    galleryIndex={this.state.gallery.galleryIndex}
                    mediaIndex={media.mediaIndex}
                    mediaTitle={media.title}
                    date={media.date}
                  />
                );
              }
            )}
          </bem.AssetGalleryGrid>
        </bem.PaginatedGalleryModal_galleryWrapper>
      );
    }
  }

  render() {
    return (
      <bem.PaginatedGalleryModal>
        <bem.PaginatedGalleryModal_heading>
          <h2>{t('All photos of ##name##').replace('##name##', this.state.gallery.title)}</h2>
          <h4>{t('Showing ##count## of ##total##').replace('##count##', this.getDisplayedMediaRange()).replace('##total##', this.state.gallery.totalMediaCount)}</h4>
        </bem.PaginatedGalleryModal_heading>

        <bem.PaginatedGalleryModal_body>
          <GalleryControls
            offset={this.state.offset}
            changeOffset={this.changeOffset}
            pageCount={this.getTotalPages()}
            goToPage={this.goToPage}
            currentPage={this.state.currentPage}
            filterOrder={this.state.filterOrder}
            changeSort={this.changeSort}
          />

          {this.renderGallery()}

          <GalleryControls
            offset={this.state.offset}
            changeOffset={this.changeOffset}
            pageCount={this.getTotalPages()}
            goToPage={this.goToPage}
            currentPage={this.state.currentPage}
            filterOrder={this.state.filterOrder}
            changeSort={this.changeSort}
            selectDirectionUp
          />

        </bem.PaginatedGalleryModal_body>
      </bem.PaginatedGalleryModal>
    );
  }
};

class GalleryControls extends React.Component {
  onPaginatePageChange(evt) {
    this.props.goToPage(evt.selected + 1);
  }

  render() {
    return (
      <bem.PaginatedGalleryModal_controls>
        <div className='change-offset'>
          <label>{t('Per page:')}</label>

          <Select
            className='kobo-select'
            classNamePrefix='kobo-select'
            options={OFFSET_OPTIONS}
            name='selected-filter'
            value={this.props.offset}
            onChange={this.props.changeOffset}
            isSearchable={false}
            isClearable={false}
            menuPlacement='auto'
          />
        </div>

        <ReactPaginate
          previousLabel={t('Previous')}
          nextLabel={t('Next')}
          breakLabel={'…'}
          breakClassName={'break-me'}
          pageCount={this.props.pageCount}
          marginPagesDisplayed={1}
          pageRangeDisplayed={3}
          onPageChange={this.onPaginatePageChange.bind(this)}
          containerClassName={'pagination'}
          activeClassName={'active'}
          forcePage={this.props.currentPage - 1}
        />

        <Select
          className='kobo-select change-sort'
          classNamePrefix='kobo-select'
          options={SORT_OPTIONS}
          name='selected-filter'
          value={this.props.filterOrder}
          onChange={this.props.changeSort}
          isSearchable={false}
          isClearable={false}
          menuPlacement='auto'
        />
      </bem.PaginatedGalleryModal_controls>
    );
  }
};

reactMixin(PaginatedGalleryModal.prototype, Reflux.ListenerMixin);